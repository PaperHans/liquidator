import { shuffle } from 'lodash';
export const buildBatchOfAccounts = (acctsArr, batchSize, idx) => {
  const idxStart = idx * batchSize;
  const idxEnd = (idx + 1) * batchSize;
  const batchArr = acctsArr.slice(idxStart, idxEnd).map(acct => acct.address);
  const shuffled = shuffle(batchArr);
  return shuffled;
};