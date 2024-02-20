const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/electric");
// const Schemas = require("../../Schemas/property");
// const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");

// router.post("/duestatus", ctrl.updateDuesData);
// router.post("/electricstatus", ctrl.updateElectricData);

router.use(authenticate);
router.get("/", ctrl.getElectric);
router.post("/update-relation", ctrl.updateElectricIdToAllProp);
router.post("/add", ctrl.addElectric);

module.exports = router;
