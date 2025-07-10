# Traffic light controller

- GMNS (https://github.com/zephyr-data-specs/GMNS) # стандарт зберігання даних мережі транспорту

_ ПЗ _

- SUMO (https://github.com/eclipse-sumo/sumo) (wizard works, netedit multiplatform error) # фреймворк по управлінню транспортними потоками
installation guide: https://www.youtube.com/watch?v=zQH1n0Fvxes

- STDG (https://github.com/YXZhangSWJTU/space-time-diagram_gmns) # симулятор задієння світлофорів

- VISSIM (https://github.com/brianhuey/vissim) (python2 only) # аналог sumo

- AIMSUN (https://www.aimsun.com/) (license) #

- MATSIM (https://matsim.org) (JavaFX)

- SCOOT (https://trlsoftware.com/software/intelligent-signal-control/scoot/) (license)

---

## Алгоритм
- отримуємо карту обсті взаємодії
- отримаємо з карти дорожну сітку
- накладаємо на дорожну сітку вузли (світлофори)
- повʼязуємо дорожні секції за вузлами


---

## БД
read <GMNS>

Node (світлофор)
    ID
    Description? [опис стану]
    Value [GREEN/RED]
    green_phace_duration [фаза зеленого в секундах]
    red_phace_duration [фаза красного в секундах
    GeoPosition [мітка геопозиції]
    Status [0/1 - Не/Працює]

Edge (дорожний відрізок)
    ID
    Name [Назва дорожного відрізка]
    Node_source_id [ID світлофора 1]
    Node_destination_id [ID світлофора 2]
    Direction [1/2 - однонаправлене/двонаправлене]
    Lane_forward_count [кількість колій в один бік]
    Lane_backward_count [кількість колій в інший бік]

Lane (полоса дорожного відрізку)
    ID
    Edge_id
    Permit_flags [прапори дозволу руху транспортів (ALL, ...)]
    Speed_limit [швидкісний ліміт, якщо є]
    Length [Довжина]

Junction

---

## Ключові моменти
На ноді є навантаження. Воно обчислюється з датчику руху.
