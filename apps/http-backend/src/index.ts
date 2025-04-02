import express, { Request, Response } from "express";
import { db } from "@repo/db/client";

const app = express();
const port = 3000;
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "connected",
  });
});

app.post("/user", (req: Request, res: Response) => {
  const { username } = req.body;

  const user = { username: username };

  res.send({
    user,
  });
});

app.get("/user", (req: Request, res: Response) => {
  const users = db.user.findMany();

  res.send({
    users,
  });
});

app.listen(port, (err) => {
  if (!err) {
    console.log("App running on port 300");
  } else {
    console.log("error ", err);
  }
});
