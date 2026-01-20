exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const data = JSON.parse(event.body);
    const UNIT = 10000; // 만원 단위

    // --- [1. 입력값 정리] ---
    const price = Number(data.price) * UNIT;
    const loan = Number(data.loan) * UNIT;
    
    // 건축비 계산 (평 * 단가)
    const areaPyeong = Number(data.areaPyeong);
    const constPerPyeong = Number(data.constPerPyeong);
    const constCost = areaPyeong * constPerPyeong * UNIT;
    
    const constLoan = Number(data.constLoan) * UNIT;
    const deposit = Number(data.deposit) * UNIT;
    
    // 세율 및 금리
    const taxRate = Number(data.taxRate) / 100;
    const interestRate = Number(data.interestRate) / 100;

    // --- [2. 비용 계산] ---
    const taxCost = price * taxRate;
    const regFee = price * 0.002; // 법무사비 (0.2%)
    const brokerFee = price * 0.009; // 중개비 (0.9%)
    
    const totalProjectCost = price + constCost + taxCost + regFee + brokerFee;
    const totalLoan = loan + constLoan;
    const realInvest = totalProjectCost - (totalLoan + deposit);
    const monthlyInterest = (totalLoan * interestRate) / 12;

    // --- [3. 매출 계산] ---
    const roomCount = Number(data.roomCount);
    
    // 평일
    const wdPrice = Number(data.weekdayPrice) * UNIT;
    const wdRate = Number(data.weekdayRate) / 100;
    const daysWeekday = 30 * (5/7);
    const monthlyWeekdayRev = roomCount * wdRate * wdPrice * daysWeekday;

    // 주말
    const wePrice = Number(data.weekendPrice) * UNIT;
    const weRate = Number(data.weekendRate) / 100;
    const daysWeekend = 30 * (2/7);
    const monthlyWeekendRev = roomCount * weRate * wePrice * daysWeekend;

    const totalRevenue = monthlyWeekdayRev + monthlyWeekendRev;

    // --- [4. 수익 분석] ---
    const operatingCost = Number(data.etcCost); // 운영비
    const totalExpense = operatingCost + monthlyInterest;
    const netProfit = totalRevenue - totalExpense;
    const annualProfit = netProfit * 12;

    let roi = 0;
    let paybackYears = 999;

    if (realInvest > 0) {
        roi = (annualProfit / realInvest) * 100;
        paybackYears = realInvest / annualProfit;
    }

    // --- [5. 결과 전송] ---
    return {
        statusCode: 200,
        body: JSON.stringify({
            // 화면 표시용 (단위: 원 or 만원)
            constCost: Math.round(constCost / UNIT),
            taxCost: Math.round(taxCost / UNIT),
            regFee: Math.round(regFee / UNIT),
            brokerFee: Math.round(brokerFee / UNIT),
            totalProjectCost: Math.round(totalProjectCost / UNIT),
            realInvest: Math.round(realInvest / UNIT),
            
            monthlyInterest: Math.round(monthlyInterest / UNIT),
            totalLoan: Math.round(totalLoan / UNIT),

            // 차트 및 디테일용 (단위: 원)
            weekdayRevenue: Math.round(monthlyWeekdayRev),
            weekendRevenue: Math.round(monthlyWeekendRev),
            totalRevenue: Math.round(totalRevenue),
            operatingCost: Math.round(operatingCost),
            interestCost: Math.round(monthlyInterest),
            netProfit: Math.round(netProfit),
            
            roi: roi.toFixed(2),
            paybackYears: paybackYears <= 0 ? "불가" : paybackYears.toFixed(1)
        })
    };
};