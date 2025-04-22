import {PrismaClient} from "@prisma/client";
declare global{
    namespace globalThis{
        var prismadb:PrismaClient;
    }
};
const prisma = new PrismaClient();
if(process.env.Node_ENV==="production")global.prismadb=prisma;
export default prisma;