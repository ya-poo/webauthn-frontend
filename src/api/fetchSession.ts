export type Session = {
  username: string;
};

export const fetchSession = async (): Promise<Session | undefined> => {
  const response = await fetch('http://localhost:8080/session', {
    method: 'GET',
    credentials: 'include',
  });
  if (response.ok) {
    return (await response.json()) as Session;
  } else {
    return undefined;
  }
};
