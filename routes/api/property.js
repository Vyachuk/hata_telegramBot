const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/property");

router.get("/", ctrl.getAllProp);
router.post("/updateDueArrears", ctrl.updateDueArrearsForAll);

module.exports = router;
