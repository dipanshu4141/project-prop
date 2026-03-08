// src/lib/serverApi.ts

export function getServerApiBase() {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("NEXT_PUBLIC_APP_URL is not defined");
    }
  
    return `${process.env.NEXT_PUBLIC_APP_URL}/api`;
  }
  