import express from 'express';

const webhooksRouter = express.Router();

webhooksRouter.post("/clerk", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Webhook received" });
});

export default webhooksRouter;