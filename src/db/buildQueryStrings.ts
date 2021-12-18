import { TABLE_HEALTHY } from "../constants/db";
import {
  healthFactorThreshold,
  tokenOrder,
} from "../constants/generalConstants";

const amTokenStrs = tokenOrder
  .map((token) => "debt_" + token + "_eth")
  .join(",");
const debtTokenStrs = tokenOrder
  .map((token) => "debt_" + token + "_eth")
  .join(",");

export const liquidatableAcctsQuery = `
SELECT * FROM ${TABLE_HEALTHY}
WHERE health_factor <= ${healthFactorThreshold} AND
(
  LEAST(GREATEST(${amTokenStrs}),(GREATEST(${debtTokenStrs})/2)) >= 0.00003
);`;
