exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const data = JSON.parse(event.body);
    const UNIT = 10000;
    
    // 값 가져오기
    const price = Number(data.price) * UNIT;
    const loan = Number(data.loan) * UNIT;
    const constCost = Number(data.constCost) * UNIT;
    const constLoan = Number(data.constLoan) * UNIT;
    const deposit = Number(data.deposit) * UNIT;
    const interestRate = Number(data.interestRate) / 100;
    const taxRate = Number(data.taxRate) / 100;
    const roomCount = Number(data.roomCount);
    const wdPrice = Number(data.weekdayPrice) * UNIT;
    const wePrice = Number(data.weekendPrice) * UNIT;
    const wdRate = Number(data.weekdayRate) / 100;
    const weRate = Number(data.weekendRate) / 100;
    const operatingCost = Number(data.etcCost);

    // 계산 로직
    const taxCost = price * taxRate;
    const regFee = price * 0.002;
    const brokerFee = price * 0.009;
    const totalProjectCost = price + constCost + taxCost + regFee + brokerFee;
    const totalLoan = loan + constLoan;
    const realInvest = totalProjectCost - (totalLoan + deposit);
    const monthlyInterest = (totalLoan * interestRate) / 12;

    const monthlyRevWeekday = roomCount * wdRate * wdPrice * (30 * 5/7);
    const monthlyRevWeekend = roomCount * weRate * wePrice * (30 * 2/7);
    const totalRevenue = monthlyRevWeekday + monthlyRevWeekend;
    const totalExpense = operatingCost + monthlyInterest;
    const netProfit = totalRevenue - totalExpense;
    
    let roi = 0;
    if (realInvest > 0) roi = ((netProfit * 12) / realInvest) * 100;

    return {
        statusCode: 200,
        body: JSON.stringify({
            totalProjectCost: Math.round(totalProjectCost),
            realInvest: Math.round(realInvest),
            totalRevenue: Math.round(totalRevenue),
            monthlyInterest: Math.round(monthlyInterest),
            netProfit: Math.round(netProfit),
            roi: roi.toFixed(2)
        })
    };
};