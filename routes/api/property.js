const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/property");

router.post("/updateDueArrears", ctrl.updateDueArrearsForAll);

module.exports = router;
