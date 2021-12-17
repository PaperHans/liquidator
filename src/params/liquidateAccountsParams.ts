import { ConnectionInfo } from "ethers/lib/utils";

/**
 * Creates a websocket connection info object to pass to a JsonRpcProvider
 * @param url 
 * @param timeout 
 * @param user 
 * @param password 
 * @param allowInsecureAuthentication 
 * @param allowGzip 
 * @param throttleLimit 
 * @param throttleSlotInterval 
 * @param throttleCallback 
 * @returns 
 */
export const createWsConnInfo = (
  url: string,
  timeout = 30000,
  user?: string,
  password?: string,
  allowInsecureAuthentication?: boolean,
  allowGzip?: boolean,
  throttleLimit = 5,
  throttleSlotInterval = 5000,
  throttleCallback?: (attempt: number, url: string) => Promise<boolean>
): ConnectionInfo => {
  return {
    url,
    user,
    password,
    allowInsecureAuthentication,
    allowGzip,
    throttleLimit,
    throttleSlotInterval,
    throttleCallback,
    timeout, //number,
  };
};

/**
 * DEPRECATED
 * @deprecated
 */
export const web3WebsocketOptions = {
  // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
  headers: {
    authorization: "Basic username:password",
  },

  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false,
  },
  timeout: 30000, // ms
};
