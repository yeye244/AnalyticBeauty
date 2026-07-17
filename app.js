const express = require("express");
const morgan = require("morgan");
const app = express();

app.use(morgan("dev"));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname + "/public"));

const userRouter = require("./routes/userRouter");
app.use("/", userRouter);

const photoRouter = require("./routes/photoRouter");
app.use("/", photoRouter);

const analysisRouter = require("./routes/analysisRouter");
app.use("/", analysisRouter);

const recommendRouter = require("./routes/recommendRouter");
app.use("/", recommendRouter);

const skincareRouter = require("./routes/skincareRouter");
app.use("/", skincareRouter);

const styleRouter = require("./routes/styleRouter");
app.use("/", styleRouter);

const systemRouter = require("./routes/systemRouter");
app.use("/", systemRouter);

const bundleRouter = require("./routes/bundleRouter");
app.use("/", bundleRouter);

const recommendEffectRouter = require("./routes/recommendEffectRouter");
app.use("/", recommendEffectRouter);

app.listen(8080, () => {
  console.log(`服务器已启动，请通过 http://127.0.0.1:8080 访问页面`);
});