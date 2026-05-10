import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthenticationState, initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';

export async function useDBAuthState(prisma: PrismaService): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const writeData = async (id: string, data: any) => {
    await prisma.waAuthState.upsert({
      where:  { id },
      update: { data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
      create: { id, data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
    });
  };

  const readData = async (id: string) => {
    const row = await prisma.waAuthState.findUnique({ where: { id } });
    if (!row) return null;
    return JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
  };

  const removeData = async (id: string) => {
    await prisma.waAuthState.delete({ where: { id } }).catch(() => {});
  };

  const creds = (await readData('creds')) ?? initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: any = {};
          for (const id of ids) {
            let value = await readData(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: async (data) => {
          for (const [type, ids] of Object.entries(data)) {
            for (const [id, value] of Object.entries(ids as any)) {
              if (value) {
                await writeData(`${type}-${id}`, value);
              } else {
                await removeData(`${type}-${id}`);
              }
            }
          }
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
  };
}