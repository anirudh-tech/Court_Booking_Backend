import { ObjectId, Types } from "mongoose";


export interface UserEntity {
    _id: Types.ObjectId,
    phoneNumber: string
}


