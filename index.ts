import * as express from "express";
import * as knex from "knex";
import { CronJob } from "cron";
import type { ErrorRequestHandler } from "express";
const app = express();
const port = 8080;
const TABLE = "models";
const URL = "https://openrouter.ai/api/v1/models";
const pgsql = knex({
  client: "pg",
  connection: {
    database: "task",
    user: "task",
    password: "task",
    host: "db",
    port: 5432,
  },
});

const job = CronJob.from({
  cronTime: "0 1 * * *",
  //cronTime: "*/1 * * * *",
  onTick: async function () {
    let response = await fetch(URL);

    if (response.ok) {
      let json = await response.json();
      await putModels(json.data);
    } else {
      console.error("Ошибка HTTP: " + response.status);
    }
  },
  start: true,
});

interface IModel {
  context_length: number;
  id: string;
  modality: string;
  name: string;
  description: string;
}
app.use(express.json());
app.use(function (err, _req, res, _next) {
  res.status(err.status || 500);
  res.json({ error: err });
} as ErrorRequestHandler);

app.get("/api/models", async (req, res): Promise<void> => {
  let result: Array<IModel> = await pgsql(TABLE).select("*");

  res.status(200).send(result);
});

async function putModels(raw_models: any) {
  //@ts-ignore
  let models: Array<IModel> = raw_models.map((v) => ({
    context_length: v.context_length,
    id: v.id,
    modality: v.architecture.modality,
    name: v.name,
    description: v.description,
  }));
  await pgsql(TABLE).insert(models);
}

app.post("/api/models", async (req, res): Promise<void> => {
  if (!Array.isArray(req.body)) {
    res.status(500).send("Please send array of models");
  }
  await putModels(req.body);
  res.status(200).send();
});

app.get("/api/models/:id", async (req, res): Promise<void> => {
  if (!req.params["id"] || req.params["id"] === "") {
    res.status(500).send("Model need to have id for update");
  }

  let id: string = req.params["id"];
  let result: Array<IModel> = await pgsql(TABLE).select("*").where("id", id);

  if (result.length == 0) {
    res.status(500).send("Model not found");
    return;
  }

  res.status(200).send(result);
});

app.delete("/api/models/:id", async (req, res): Promise<void> => {
  if (!req.params["id"] || req.params["id"] === "") {
    res.status(500).send("Model need to have id for update");
  }

  let id: string = req.params["id"];
  await pgsql(TABLE).where("id", id).delete();

  res.status(200).send();
});

app.put("/api/models/:id", async (req, res): Promise<void> => {
  if (Array.isArray(req.body)) {
    res.status(500).send("Please don't send array of models");
  }
  if (!req.params["id"] || req.params["id"] === "") {
    res.status(500).send("Model need to have id for update");
  }
  let id: string = req.params["id"];
  let model: IModel = {
    context_length: req.body.context_length,
    id: req.body.id,
    modality: req.body.architecture.modality,
    name: req.body.name,
    description: req.body.description,
  };
  await Promise.all([
    pgsql(TABLE).where("id", id).delete(),
    pgsql(TABLE).insert(model),
  ]);

  res.status(200).send();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
