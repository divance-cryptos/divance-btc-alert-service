import { Request, Response } from "express";
const rp = require("request-promise");
import { PrismaClient } from "@prisma/client";
import postTgAth from "../lib/telegram";
const prisma = new PrismaClient();

const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_KEY,
  APISECRET: process.env.BINANCE_SECRET,
});

const processUpdate = async (pair: string, symbol: string) => {
  const ticks = await binance.candlesticks(pair, "1d");
  let lastTick = ticks[ticks.length - 1];
  let [
    time,
    open,
    high,
    low,
    close,
    volume,
    closeTime,
    assetVolume,
    trades,
    buyBaseVolume,
    buyAssetVolume,
    ignored,
  ] = lastTick;

  const row = {
    price_date: new Date(time),
    symbol: symbol,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
  };

  // delete
  await prisma.btc.deleteMany({
    where: {
      price_date: new Date(time),
      symbol: symbol
    },
  });

  // insert
  await prisma.btc.create({
    data: row,
  });

  console.log('🦊🦊 insert')
  // get the current time max
  let max;
  max = await prisma.btc.groupBy({
    by: ['symbol'],
    _max: {
      high: true,
    },
  });

  const currentMax = max[0]._max.high || 0;
  console.log("max", currentMax);

  // get the previous max
  let maxPrevious;
  maxPrevious = await prisma.btc_ath.findFirst({
    where: {
      symbol: symbol,
    },
    select: {
      high: true,
    },
  }) || { high: 0 };

  const previousMax = maxPrevious.high;

  if (previousMax < currentMax) {
    await prisma.btc_ath.deleteMany({
      where: {
        symbol: symbol,
      },
    });

    await prisma.btc_ath.create({
      data: {
        price_date: new Date(),
        symbol: symbol,
        high: currentMax,
      },
    });
   postTgAth(currentMax.toString(), symbol);
  }
};

const updateAggregatesTable = async (req: Request, res: Response) => {
  try {
    const supportedPairs = [
      { symbol: "BTC/USDT", pair: "BTCUSDT" },
      { symbol: "ETH/USDT", pair: "ETHUSDT" },
      { symbol: "ZIG/USDT", pair: "ZIGUSDT" }
    ];
    supportedPairs.forEach((pair) => {
      processUpdate(pair.pair, pair.symbol);
    })

    res.status(200).json({
      response: "Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
};

const updateBtcTable = async (req: Request, res: Response) => {
  try {
    // get data
    const ticks = await binance.candlesticks("BTCUSDT", "1d");
    let lastTick = ticks[ticks.length - 1];
    let [
      time,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      assetVolume,
      trades,
      buyBaseVolume,
      buyAssetVolume,
      ignored,
    ] = lastTick;

    const btcRow = {
      price_date: new Date(time),
      symbol: "BTC/USDT",
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    };

    console.log(btcRow);
    console.log(time);
    console.log(new Date(time), new Date(closeTime), high);

    // delete
    await prisma.btc.deleteMany({
      where: {
        price_date: new Date(time),
      },
    });

    // insert
    await prisma.btc.create({
      data: btcRow,
    });
    let max;

    max = await prisma.btc.aggregate({
      _max: {
        high: true,
      },
    });

    const currentMax = max._max.high || 0;
    console.log("max", currentMax);
    max = await prisma.btc_ath.aggregate({
      _max: {
        high: true,
      },
    });

    const previousMax = max._max.high || 0;

    console.log("previous", previousMax);
    if (previousMax < currentMax) {
      await prisma.btc_ath.deleteMany({
        where: {
          symbol: "BTC/USDT",
        },
      });

      await prisma.btc_ath.create({
        data: {
          price_date: new Date(),
          symbol: "BTC/USDT",
          high: currentMax,
        },
      });

      postTgAth(currentMax.toString(), 'bitcoin');
    }

    res.status(200).json({
      response: "Updated",
    });
    // litescript
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
};

const getAth = async (req: Request, res: Response) => {
  try {
    const ath: object | null = await prisma.btc_ath.findMany({
      select: {
        symbol: true,
        price_date: true,
        high: true,
      },
    });
    return res.status(200).json({
      rows: ath,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
};

// const getAthOld = async (req: Request, res: Response) => {
//   try {
//     const ath: any = await prisma.btc_ath.findUnique({
//       where: {
//         symbol: 'BTC/USDT'
//       },
//       select: {
//         price_date: true,
//         high: true,
//       },
//     });

//     return res.status(200).json({
//       rows: ath,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error });
//   }
// };

const postTgATH = async (req: Request, res: Response) => {
  const { price } = req.body;
  postTgAth(price, '');
  return res.status(200).json({
    message: "posted",
  });
};

const bootstrap = async (req: Request, res: Response) => {
  const { price } = req.body;
  await prisma.btc_ath.create({
    data: {
      price_date: new Date("2021-11-10"),
      symbol: "BTC/USDT",
      high: 65000,
    },
  });
  return res.status(200).json({
    message: "bootstraped",
  });
};

export default { getAth, updateBtcTable, postTgATH, bootstrap, updateAggregatesTable };
