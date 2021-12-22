import { getDirContents } from "../../../utils/fsUtils";

/** @deprecated */
const exportObj: { [index: string]: any } = {};
getDirContents(exportObj, false);
export default exportObj;
