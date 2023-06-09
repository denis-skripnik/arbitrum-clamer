# arbitrum-clamer
Скрипт для получения токена сети Arbitrum.

## Перед запуском:
1. Скачиваем скрипт:
git clone https://github.com/denis-skripnik/arbitrum-clame
или просто нажмите "Code", "Download ZIP", распакуйте архив.
2. Заходим в папку data
3. Открываем файл private_keys.txt
И вставляем 1 приватный ключ на одной строке. Проверяйте на наличие пробелов или иных символов до и после - если есть, будет ошибка.
4. Если надо, открываем addresses.txt
И вставляем адрес получения $ARB с новой строки.
При этом, адрес в строке 1 будет относиться к первому приватнику, в строке 10 - к десятому, и пр.
Адреса нужны, если вы хотите отправить токены на биржу.
5. Возвращаемся в основную папку скрипта, и открываем config.json
 - Здесь меняем plus_gas_limit, если хотим установить лимит газа выше текущего на n единиц.
 - Меняем rpc на свой. Можете взять на [Omnia](https://app.omniatech.io/dashboard), [Lava](https://gateway.lavanet.xyz/projects) или [Alchemy](https://dashboard.alchemy.com).
 Остальные пункты ни в коем случае не трогайте. Скрипт перестанет работать.
Важно также, чтоб вы следили за кавычками: значения за исключением plus_gas_limit должны быть между ними.
6. Ставим node.js и npm, если ещё нет. [Windows](https://nodejs.org/ru/download) - обычный установщик, [Linux](https://losst.pro/ustanovka-node-js-ubuntu-18-04).
7. Проверяем, вводя команды в терминале:
node -v
npm -v
Если возвращает версию, всё ок. Если нет, перезагрузите устройство и попробуйте ещё раз.
8. Идём в терминале в папку со скриптом.
``npm install``
Ждём.
После установки:
``npm i pm2 --g``
Ждём.
Далее вводим:
pm2 start start.js -o logs/out.log -e logs/errors.log
И получаем запущенный в фоне скрипт.

## Код
С комментариями, открыт. Всё в файле start.js.

Скрипт масштабируемый: его можно адаптировать под claim других токенов, у которых нет особых требований к получению, типа только с сайта...

## И ещё
Я начинающий в сфере написания скриптов для смартконтрактов. Пишите логи в https://t.me/blind_dev_chat, если что не так...
И буду рад пулл-реквестам с правками, если таковые есть.