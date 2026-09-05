import { Router, type IRouter } from "express";
import healthRouter from "./health";
import medlensRouter from "./medlens";

const router: IRouter = Router();

router.use(healthRouter);
router.use(medlensRouter);

export default router;
