import { getDirContents } from "../../../utils/fsUtils";

const exportObj: { [index: string]: any } = {};
getDirContents(exportObj, true);
export default exportObj;
