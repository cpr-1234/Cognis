const crypto = require('crypto');
const Study = require('../db/models/Study');
const StudentSubmission = require('../db/models/StudentSubmission');

// Helper to generate a unique Anonymous Student ID (e.g. ANON-4A8F2B)
const generateAnonymousId = async () => {
  let isUnique = false;
  let anonId = '';

  while (!isUnique) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    anonId = `ANON-${randomHex}`;
    const existing = await StudentSubmission.findOne({ anonymousId: anonId });
    if (!existing) {
      isUnique = true;
    }
  }

  return anonId;
};


// 1. Create a New Study (Researcher)
const createStudy = async (req, res) => {
  try {
    const { title, description, studyCode } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Study title is required.',
      });
    }

    let code = studyCode ? studyCode.toUpperCase().trim() : '';
    if (!code) {
      const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
      code = `COG-${randomSuffix}`;
    }

    // Check if code already exists
    const existing = await Study.findOne({ studyCode: code });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Study code "${code}" already exists. Please choose a different code.`,
      });
    }

    const researcher = req.researcher;

    const study = new Study({
      title: title.trim(),
      description: description ? description.trim() : '',
      studyCode: code,
      uniqueUrl: `/study/${code}`,
      researcherId: researcher?._id,
      researcherName: researcher?.name || 'Lead Researcher',
      status: 'active',
    });

    await study.save();

    return res.status(201).json({
      success: true,
      message: 'Study created successfully with unique URL.',
      study,
    });
  } catch (error) {
    console.error('Create study error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating study.',
    });
  }
};

// 2. Get All Studies (Researcher dashboard)
const getAllStudies = async (req, res) => {
  try {
    const filter = req.researcher?._id ? { researcherId: req.researcher._id } : {};
    const studies = await Study.find(filter).sort({ createdAt: -1 });

    // Update real submission counts from database
    const enrichedStudies = await Promise.all(
      studies.map(async (study) => {
        const count = await StudentSubmission.countDocuments({
          studyCode: study.studyCode,
          hasSubmitted: true,
        });
        const obj = study.toObject();
        obj.submissionCount = count;
        return obj;
      })
    );

    return res.status(200).json({
      success: true,
      studies: enrichedStudies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch studies.',
    });
  }
};

// 3. Get Study By Code (For Student access)
const getStudyByCode = async (req, res) => {
  try {
    const { studyCode } = req.params;
    if (!studyCode) {
      return res.status(400).json({ success: false, message: 'Study code is required.' });
    }

    const normalizedCode = studyCode.toUpperCase().trim();
    const study = await Study.findOne({ studyCode: normalizedCode });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: `Study with code "${normalizedCode}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      study,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching study details.',
    });
  }
};

// 4. Student Sign-Up for a Study (Generates Anonymous ID)
const studentSignup = async (req, res) => {
  try {
    const { email, studyCode } = req.body;

    if (!email || !studyCode) {
      return res.status(400).json({
        success: false,
        message: 'Student email and study code/URL are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = studyCode.toUpperCase().trim();

    // Verify study exists
    let study = await Study.findOne({ studyCode: normalizedCode });
    if (!study) {
      await seedDefaultStudies();
      study = await Study.findOne({ studyCode: normalizedCode });
    }

    if (!study) {
      return res.status(404).json({
        success: false,
        message: `No experiment found for study link code "${normalizedCode}".`,
      });
    }

    if (study.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `This study is currently ${study.status} and cannot accept submissions.`,
      });
    }

    // Check if student already registered for this specific study link
    let existingSubmission = await StudentSubmission.findOne({
      email: normalizedEmail,
      studyCode: normalizedCode,
    });

    if (existingSubmission) {
      if (existingSubmission.hasSubmitted) {
        // Enforce STRICT single submission rule per email + study link!
        return res.status(409).json({
          success: false,
          message: 'You have already submitted a reading for this study link. Only one submission is permitted per student.',
          anonymousId: existingSubmission.anonymousId,
          alreadySubmitted: true,
          submittedAt: existingSubmission.submittedAt,
          reading: existingSubmission.reading,
        });
      }

      // Existing registration that hasn't submitted their reading yet
      return res.status(200).json({
        success: true,
        message: 'Resumed your active study session.',
        anonymousId: existingSubmission.anonymousId,
        alreadySubmitted: false,
        study,
      });
    }

    // New student registration: Generate unique Anonymous Student ID
    const anonymousId = await generateAnonymousId();

    const newStudent = new StudentSubmission({
      email: normalizedEmail,
      studyCode: normalizedCode,
      studyId: study._id,
      anonymousId,
      hasSubmitted: false,
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: 'Anonymous ID assigned successfully. You may now complete the experiment.',
      anonymousId,
      alreadySubmitted: false,
      study,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A submission record for this email and study link already exists.',
        alreadySubmitted: true,
      });
    }
    console.error('Student signup error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during student sign-up.',
    });
  }
};

// 5. Submit Student Reading (Locked to one reading per email + study link)
const submitReading = async (req, res) => {
  try {
    const { email, studyCode, anonymousId, reading } = req.body;

    if (!email || !studyCode || !reading) {
      return res.status(400).json({
        success: false,
        message: 'Email, study code, and reading data are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = studyCode.toUpperCase().trim();

    // Find student record for this email + study combination
    const record = await StudentSubmission.findOne({
      email: normalizedEmail,
      studyCode: normalizedCode,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Student registration not found for this study link. Please sign up first.',
      });
    }

    // STRICT CHECK: Has the student already submitted?
    if (record.hasSubmitted) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted your reading for this study. Multiple submissions are strictly blocked.',
        anonymousId: record.anonymousId,
        alreadySubmitted: true,
        submittedAt: record.submittedAt,
        reading: record.reading,
      });
    }

    // Save reading and lock submission
    record.reading = {
      reactionTimeMs: reading.reactionTimeMs || reading.rt || 0,
      accuracy: reading.accuracy !== undefined ? reading.accuracy : 100,
      score: reading.score || 0,
      trialsCompleted: reading.trialsCompleted || 1,
      metrics: reading.metrics || {},
      notes: reading.notes || '',
    };
    record.hasSubmitted = true;
    record.submittedAt = new Date();

    await record.save();

    // Increment study submission count
    await Study.findOneAndUpdate(
      { studyCode: normalizedCode },
      { $inc: { submissionCount: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Reading successfully recorded and locked under your Anonymous ID.',
      anonymousId: record.anonymousId,
      submittedAt: record.submittedAt,
      alreadySubmitted: true,
      reading: record.reading,
    });
  } catch (error) {
    console.error('Submit reading error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting reading.',
    });
  }
};

// 6. Get Anonymized Readings for a Study (Researcher View)
const getStudyReadings = async (req, res) => {
  try {
    const { studyCode } = req.params;
    const normalizedCode = studyCode.toUpperCase().trim();

    const submissions = await StudentSubmission.find({
      studyCode: normalizedCode,
      hasSubmitted: true,
    })
      .select('anonymousId reading submittedAt createdAt')
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      studyCode: normalizedCode,
      totalReadings: submissions.length,
      readings: submissions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch study readings.',
    });
  }
};

module.exports = {
  createStudy,
  getAllStudies,
  getStudyByCode,
  studentSignup,
  submitReading,
  getStudyReadings,
};
