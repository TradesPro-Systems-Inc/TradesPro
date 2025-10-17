// test.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { lookupConductorFromTable } from "./dist/index.js";

// ESM 兼容：得到当前目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 载入 CEC 表格数据
const table2 = JSON.parse(fs.readFileSync(path.join(__dirname, "../tables/table2.json"), "utf-8"));
const table4 = JSON.parse(fs.readFileSync(path.join(__dirname, "../tables/table4.json"), "utf-8"));
const table5 = JSON.parse(fs.readFileSync(path.join(__dirname, "../tables/table5.json"), "utf-8"));

// 执行测试
const result = lookupConductorFromTable(60, {
  material: "Al",
  insulation: "90c",
  ambientTempC: 35,
  numConductors: 4,
  table2,
  table4,
  table5
});

console.log("✅ lookupConductorFromTable result:");
console.log(JSON.stringify(result, null, 2));
