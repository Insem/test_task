import * as express from "express";
import * as knex from "knex";
import { CronJob } from "cron";

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
    host: "localhost",
    port: 5432,
  },
});

const job = CronJob.from({
  //cronTime: "0 1 * * *",
  cronTime: "*/1 * * * *",
  onTick: async function () {
    let response = await fetch(URL);

    if (response.ok) {
      // если HTTP-статус в диапазоне 200-299
      // получаем тело ответа (см. про этот метод ниже)
      let json = await response.json();
      console.log(json);
      await putModels(json.data);
    } else {
      alert("Ошибка HTTP: " + response.status);
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
app.get("/api/models", async (req, res): Promise<void> => {
  let result: Array<IModel> = await pgsql(TABLE).select("*");

  if (result.length == 0) {
    res.status(500).send("Balance of user couldn't be less than 0");
    return;
  }

  res.status(200).send(result);
});

async function putModels(raw_models: Array<IModel>) {
  let models: Array<IModel> = raw_models.map((v: IModel) => ({
    context_length: v.context_length,
    id: v.id,
    modality: v.modality,
    name: v.name,
    description: v.description,
  }));
  console.log("--,odels", models);
  await pgsql(TABLE).insert(models);
}

app.post("/api/models", async (req, res): Promise<void> => {
  console.log("--,odels");
  await putModels(req.body);
  res.status(200);
});

app.put("/api/models/:id", async (req, res): Promise<void> => {
  console.log("--Put");
  let id: string = req.params["id"];
  let model: IModel = {
    context_length: req.body.context_length,
    id: req.body.id,
    modality: req.body.modality,
    name: req.body.name,
    description: req.body.description,
  };
  await pgsql(TABLE).where("id", id).delete();
  await pgsql(TABLE).insert(model);

  res.status(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
