exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const data = JSON.parse(event.body);
    const UNIT = 10000; // 만원 단위

    // --- [1. 기본 입력값 처리] ---
    const price = Number(data.price) * UNIT;
    const loan = Number(data.loan) * UNIT;
    
    // 건축비 계산
    const areaPyeong = Number(data.areaPyeong);
    const constPerPyeong = Number(data.constPerPyeong);
    const constCost = areaPyeong * constPerPyeong * UNIT;
    
    const constLoan = Number(data.constLoan) * UNIT;
    const deposit = Number(data.deposit) * UNIT;
    
    // 세율 및 금리
    const taxRate = Number(data.taxRate) / 100;
    const interestRate = Number(data.interestRate) / 100;

    // --- [2. 비용 및 투자금 계산] ---
    const taxCost = price * taxRate;
    const regFee = price * 0.002; // 0.2%
    const brokerFee = price * 0.009; // 0.9%
    
    const totalProjectCost = price + constCost + taxCost + regFee + brokerFee;
    const totalLoan = loan + constLoan;
    const realInvest = totalProjectCost - (totalLoan + deposit);
    const monthlyInterest = (totalLoan * interestRate) / 12;

    // --- [3. 매출 계산 (평일/주말)] ---
    const roomCount = Number(data.roomCount);
    const wdPrice = Number(data.weekdayPrice) * UNIT;
    const wdRate = Number(data.weekdayRate) / 100;
    const wePrice = Number(data.weekendPrice) * UNIT;
    const weRate = Number(data.weekendRate) / 100;

    // 월간 일수
    const daysWeekday = 30 * (5/7);
    const daysWeekend = 30 * (2/7);

    const monthlyWeekdayRev = roomCount * wdRate * wdPrice * daysWeekday;
    const monthlyWeekendRev = roomCount * weRate * wePrice * daysWeekend;
    const totalRevenue = monthlyWeekdayRev + monthlyWeekendRev;

    // --- [4. 1-2 섹션 (수동 입력 모드 지원)] ---
    // 사용자가 1-2 섹션에 직접 입력한 값이 있으면 그걸 우선시하고, 아니면 계산된 값을 씀
    const inputRevenueManual = Number(data.inputRevenue_1_2) * UNIT;
    const inputCostManual = Number(data.inputCost_1_2) * UNIT;

    // 최종 계산에 쓸 매출/비용 결정 (0이면 자동 계산값 사용)
    const finalRevenue = inputRevenueManual > 0 ? inputRevenueManual : totalRevenue;
    const operatingCost = inputCostManual > 0 ? inputCostManual : Number(data.etcCost); // 기본 운영비

    // --- [5. 최종 수익 분석] ---
    const totalExpense = operatingCost + monthlyInterest;
    const netProfit = finalRevenue - totalExpense;
    const annualProfit = netProfit * 12;

    let roi = 0;
    let paybackYears = 999;

    if (realInvest > 0) {
        roi = (annualProfit / realInvest) * 100;
        paybackYears = realInvest / annualProfit;
    }

    // --- [6. 결과 전송] ---
    return {
        statusCode: 200,
        body: JSON.stringify({
            // 화면 표시용 (단위: 원, 만원 등 적절히 변환하여 전달)
            constCost: Math.round(constCost / UNIT),
            taxCost: Math.round(taxCost / UNIT),
            regFee: Math.round(regFee / UNIT),
            brokerFee: Math.round(brokerFee / UNIT),
            totalProjectCost: Math.round(totalProjectCost / UNIT),
            realInvest: Math.round(realInvest / UNIT),
            
            monthlyInterest: Math.round(monthlyInterest / UNIT),
            totalLoan: Math.round(totalLoan / UNIT),

            // 매출 상세
            weekdayRevenue: Math.round(monthlyWeekdayRev),
            weekendRevenue: Math.round(monthlyWeekendRev),
            totalRevenue: Math.round(finalRevenue), // 1-2 섹션 반영된 최종 매출
            
            // 비용 및 수익
            operatingCost: Math.round(operatingCost),
            totalExpense: Math.round(totalExpense),
            netProfit: Math.round(netProfit),
            
            roi: roi.toFixed(2),
            paybackYears: paybackYears <= 0 ? "불가" : paybackYears.toFixed(1)
        })
    };
};