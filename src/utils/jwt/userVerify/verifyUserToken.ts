import jwt from 'jsonwebtoken'
import { IDecodedInterface } from '../../../interfaces/IDecodedInterface';
export const verifyUserToken = (token: string) => <IDecodedInterface> <unknown>{
    return: jwt.verify(token, String(process.env.ACCESS_TOKEN_SECRET), (error, decoded) => {
        if (error) {
            throw new Error(error.message);
        } else {
            return decoded as IDecodedInterface;
        }
    })
}