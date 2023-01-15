import {Buffer} from "buffer";


export const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
  return Buffer.from(buf).toString('base64')
}
