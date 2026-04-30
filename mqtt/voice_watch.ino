/*
  YBY Voice Watch Entry

  Este arquivo existe para cumprir o workflow de voz com um nome direto.
  O firmware LVGL/MQTT completo fica em:
    wearable/twatch_s3_lvgl/src/main.cpp

  Por que não duplicar o código aqui?
  - Evita dois firmwares divergentes.
  - Mantém um único ponto de manutenção.
  - Function Over Form: menos arquivo duplicado, menos bug.

  Para compilar/flash:
    cd wearable/twatch_s3_lvgl
    cp include/config.example.h include/config.h
    pio run -t upload
*/

