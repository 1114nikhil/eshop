import {PrismaClient} from "@prisma/client";
declare global{
    namespace globalThis{
        var prismadb:PrismaClient;
    }
};
const prisma = new PrismaClient();
console.log(`process.env.Node_ENV====>${process.env.Node_ENV}`)
if(process.env.Node_ENV==="production")global.prismadb=prisma;
export default prisma;