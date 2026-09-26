const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/experiment.controller");
const { authenticateResearcher } = require("../middleware/auth.middleware");

// ── Researcher (protected) ─────────────────────────────────────
router.post("/experiments", authenticateResearcher, ctrl.createExperiment);
router.get("/experiments", authenticateResearcher, ctrl.getMyExperiments);
router.get("/experiments/:id", authenticateResearcher, ctrl.getExperimentById);
router.put("/experiments/:id", authenticateResearcher, ctrl.updateExperiment);
router.post("/experiments/:id/publish", authenticateResearcher, ctrl.publishExperiment);
router.delete("/experiments/:id", authenticateResearcher, ctrl.deleteExperiment);
router.get("/experiments/:id/results", authenticateResearcher, ctrl.getExperimentResults);

// ── Participant (public) ──────────────────────────────────────
router.get("/experiment/:publicId", ctrl.getExperimentByPublicId);
router.post("/experiment/:publicId/start", ctrl.startSession);
router.post("/session/:sessionId/submit", ctrl.submitResponses);

module.exports = router;
