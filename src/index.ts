import dbConnection from './config/dbConnection'
import server from './server'

//  test
(async() => {
    try {
        server;
        await dbConnection()
        .catch((error: any) => {
            console.log(error?.message);
            process.exit();
        })
    } catch (error: any) {
        console.log(error?.message)
    }
})();
