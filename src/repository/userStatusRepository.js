import UserStatus from "../schema/userStatus";
import crudRepository from "./crudRepository";

const userStatusRepository = {
    ...crudRepository(UserStatus),

}

export default userStatusRepository;