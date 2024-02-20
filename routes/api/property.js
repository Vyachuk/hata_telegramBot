const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/property");
const Schemas = require("../../Schemas/property");
const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");

router.post("/duestatus", ctrl.updateDuesData);
router.post("/electricstatus", ctrl.updateElectricData);

router.use(authenticate);
router.get("/", ctrl.getAllProp);
router.post("/add", validateBody(Schemas.addSchema), ctrl.addProperty);
router.post("/updateDueArrears", ctrl.updateDueArrearsForAll);
router.get("/electro", ctrl.getAllElectricData);

module.exports = router;
