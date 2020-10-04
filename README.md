This is an [Azure Functions](https://azure.microsoft.com/services/functions) app that provides status checks on various Airmash services.

Currently, it reports on TLS connectivity to HTTPS endpoints and certificate data, including expiry periods.

In the future, additional status checks and other service health measurements may be added.

There are two functions implemented:
 * [status](/status), a web page hosted via https://status.airmash.online
 * [weeklyStatusCheck](/weeklyStatusCheck), which sends a email every week regarding the above, warning if any certificates are close to expiry
