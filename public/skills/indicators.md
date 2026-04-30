<!-- runtime-demo: true -->
<!-- editable-fields: ma_periods,ma_cross_short,ma_cross_long,rsi_period,rsi_overbought,rsi_oversold,macd_fast,macd_slow,macd_signal,stoch_k_period,stoch_d_period,stoch_overbought,stoch_oversold,bb_period,bb_std,wr_period,wr_overbought,wr_oversold,cci_period,cci_strong_buy,cci_buy,cci_sell,cci_strong_sell,atr_period,roc_period,obv_lookback -->

# Runtime Indicator Skill

Edit the values below and click `Apply Skills` in the dashboard.

```yaml
ma_periods: 5,10,20,50,100,200
ma_cross_short: 5
ma_cross_long: 20
rsi_period: 14
rsi_overbought: 70
rsi_oversold: 30
macd_fast: 12
macd_slow: 26
macd_signal: 9
stoch_k_period: 9
stoch_d_period: 6
stoch_overbought: 80
stoch_oversold: 20
bb_period: 20
bb_std: 2.0
wr_period: 14
wr_overbought: -20
wr_oversold: -80
cci_period: 14
cci_strong_buy: -200
cci_buy: -100
cci_sell: 100
cci_strong_sell: 200
atr_period: 14
roc_period: 12
obv_lookback: 5
```

Validation:
- `ma_periods` must be a comma-separated list of positive periods
- `ma_cross_short` must be lower than `ma_cross_long`
- `rsi_oversold` must be lower than `rsi_overbought`
- `macd_fast` must be lower than `macd_slow`
- `stoch_oversold` must be lower than `stoch_overbought`
- `wr_oversold` must be lower than `wr_overbought`
- `cci_strong_buy < cci_buy < cci_sell < cci_strong_sell`
- periods must be positive
