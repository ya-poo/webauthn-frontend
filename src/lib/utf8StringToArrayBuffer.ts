const encoder = new TextEncoder()

export const utf8StringToArrayBuffer = (str: string): ArrayBuffer => {
  return encoder.encode(str)
}
