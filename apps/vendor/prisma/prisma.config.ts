//prisma/prisma.config.ts 
export default { db: { adapter: "mysql",
      url: process.env.DATABASE_URL  

}, 
};