import express, { Request, Response } from "express";
import { prisma } from "@repo/db/client";

const app = express();
const port = 3000;
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "connected",
  });
});

app.post("/user", (req: Request, res: Response) => {
  const { username, password, last_name, first_name, email } = req.body;

  const user = prisma.user.create({
    data: {
      username,
      first_name,
      last_name,
      email,
      password,
    },
  });

  res.send({
    user,
  });
});

app.get("/user", (req: Request, res: Response) => {
  const users = prisma.user.findMany();

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
