const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/users");

const Schemas = require("../../Schemas/user");

const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");

router.use(authenticate);
router.get("/", ctrl.getAllUsers);
router.get("/unregister", ctrl.getAllUnregisterUsers);
router.post("/add", validateBody(Schemas.addSchema), ctrl.addUser);
router.get("/getpin", ctrl.getAllPin);

module.exports = router;
