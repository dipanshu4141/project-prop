import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthenticationState, initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';

export async function useDbAuthState(
  prisma: PrismaService,
  phoneId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {

  async function readData(key: string) {
    const row = await prisma.waAuthState.findUnique({ where: { id: `${phoneId}:${key}` } });
    if (!row) return null;
    return JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
  }

  async function writeData(key: string, data: any) {
    await prisma.waAuthState.upsert({
      where:  { id: `${phoneId}:${key}` },
      create: { id: `${phoneId}:${key}`, data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
      update: { data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
    });
  }

  async function removeData(key: string) {
    await prisma.waAuthState.delete({ where: { id: `${phoneId}:${key}` } }).catch(() => {});
  }

  const creds = await readData('creds') ?? initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: Record<string, any> = {};
          for (const id of ids) {
            const val = await readData(`${type}-${id}`);
            if (val) data[id] = val;
          }
          return data;
        },
        set: async (data) => {
          for (const [type, ids] of Object.entries(data)) {
            for (const [id, val] of Object.entries(ids as any)) {
              if (val) await writeData(`${type}-${id}`, val);
              else     await removeData(`${type}-${id}`);
            }
          }
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
  };
}