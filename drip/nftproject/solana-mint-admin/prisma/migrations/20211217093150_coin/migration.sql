-- CreateTable
CREATE TABLE "Coin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "supply" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coin_name_key" ON "Coin"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Coin_symbol_key" ON "Coin"("symbol");
