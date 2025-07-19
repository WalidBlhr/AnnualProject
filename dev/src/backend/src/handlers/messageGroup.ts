import { Request, Response } from "express";
import { createMessageGroupValidation, messageGroupIdValidation, listMessageGroupsValidation, patchMessageGroupValidation } from "./validators/messageGroup";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../db/database";
import { MessageGroup } from "../db/models/message_group";
import { checkUserIdArray, findUserById } from "./user";

export const listMessageGroups = async (req: Request, res: Response) : Promise<void> => {
  try {
    const validated = listMessageGroupsValidation.validate(req.query);
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const listGroupsRequest = validated.value;
    const query = AppDataSource.createQueryBuilder(MessageGroup, "mg");

    // Queries
    if (listGroupsRequest.name !== undefined) {
      query.andWhere("mg.name = :name", {name: listGroupsRequest.name});
    }

    if (listGroupsRequest.ownerId !== undefined) {
      query.andWhere("mg.ownerId = :id", {id: listGroupsRequest.ownerId});
    }

    const userJointure = listGroupsRequest.ownerFullname !== undefined;
    if (userJointure && listGroupsRequest.ownerFullname !== undefined) { // Must check the condition twice for TS :|
      const [firstname, lastname] = listGroupsRequest.ownerFullname.split(' ');
      if (lastname === undefined || `${firstname} ${lastname}` !== listGroupsRequest.ownerFullname) {
        res.status(400).send({error: "Fullname must be made of one space between the firstname and the fullname. (ownerFullname)"});
        return;
      }

      query
        .leftJoin("mg.owner", "owner")
        .andWhere("owner.firstname = :firstname", {firstname})
        .andWhere("owner.lastname = :lastname", {lastname});
    }

    const membersJointure = listGroupsRequest.membersMax !== undefined || listGroupsRequest.membersMin !== undefined;
    if (membersJointure) {
      query.leftJoin("mg.members", "members");

      if (listGroupsRequest.membersMax !== undefined) {
        query.andHaving("COUNT(members.id) <= :membersMax", {membersMax: listGroupsRequest.membersMax});
      }

      if (listGroupsRequest.membersMin !== undefined) {
        query.andHaving("COUNT(members.id) >= :membersMin", {membersMin: listGroupsRequest.membersMin});
      }
    }

    const messagesJointure = listGroupsRequest.messageMax !== undefined || listGroupsRequest.messageMin !== undefined;
    if (messagesJointure) {
      query.leftJoin("mg.messages", "msg");

      if (listGroupsRequest.messageMax !== undefined) {
        query.andHaving("COUNT(msg.id) <= :messageMax", {messageMax: listGroupsRequest.messageMax});
      }

      if (listGroupsRequest.messageMin !== undefined) {
        query.andHaving("COUNT(msg.id) >= :messageMin", {messageMin: listGroupsRequest.messageMin});
      }
    }

    if (userJointure || membersJointure || messagesJointure) {
      query.groupBy("mg.id");
    }

    // Pagination
    query.skip((listGroupsRequest.page - 1) * listGroupsRequest.limit);
    query.take(listGroupsRequest.limit);

    const [groups, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / listGroupsRequest.limit);

    res.status(200).send({
      data: groups,
      page_size: listGroupsRequest.limit,
      page: listGroupsRequest.page,
      total_count: total,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "internal error"});
  }
};

export const getMessageGroup = async (req: Request, res: Response) : Promise<void> => {
  try {
    const validated = messageGroupIdValidation.validate(req.params);
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const sentGroup = validated.value;
    const groupRepo = AppDataSource.getRepository(MessageGroup);
    const group = await groupRepo.findOne({where: {id: sentGroup.id}, relations: ["owner", "members"]});
    if (group === null) {
      res.status(404).send({error: `Group with id ${sentGroup.id} not found.`});
      return;
    }

    const currentUser = (req as any).user
    if (!group.isMemberOfGroup(currentUser.userId) && currentUser.role !== 1 && currentUser.userId !== group.owner.id) {
      res.status(401).send({error: "Forbidden"});
      return;
    }

    res.status(200).send(group);
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "internal error"});
  }
};

export const createMessageGroup = async (req: Request, res: Response) : Promise<void> => {
  try {
    const validated = createMessageGroupValidation.validate(req.body);
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const createGroupReq = validated.value;
    const groupRepo = AppDataSource.getRepository(MessageGroup);

    const owner = await findUserById(createGroupReq.ownerId);
    if (owner === null) {
      res.status(404).send({error: `User with ID ${createGroupReq.ownerId} not found. (ownerId)`});
      return;
    }

    const group = groupRepo.create({
      name: createGroupReq.name,
      description: createGroupReq.description ?? "",
      owner: owner,
      members: [owner],
    });

    if (createGroupReq.membersIDs !== undefined && createGroupReq.membersIDs.length > 0) {
      const {validUsers, notFoundUsersIDs} = await checkUserIdArray(createGroupReq.membersIDs);
      if (notFoundUsersIDs.length > 0) {
        const plural = notFoundUsersIDs.length > 1 ? 's' : '';
        res.status(404).send({error: `User${plural} with ID${plural} ${notFoundUsersIDs} not found. (membersIDs)`});
        return;
      }

      console.log(validUsers)
      group.members.push(...validUsers);
    }

    const groupeCreated = await groupRepo.save(group);
    res.status(201).send(groupeCreated);
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "internal error"});
  }
};

export const patchMessageGroup = async (req: Request, res: Response) : Promise<void> => {
  try {
    const validated = patchMessageGroupValidation.validate({...req.params, ...req.body});
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const sentGroup = validated.value;
    const groupRepo = AppDataSource.getRepository(MessageGroup);
    const group = await groupRepo.findOne({where: {id: sentGroup.id}, relations: ["owner", "members", "messages"]});
    if (group === null) {
      res.status(404).send({error: `Group with id ${sentGroup.id} not found.`});
      return;
    }

    const currentUser = (req as any).user
    if (currentUser.role !== 1 && currentUser.userId !== group.owner.id) {
      res.status(401).send({error: "Forbidden"});
      return;
    }

    if (sentGroup.name) {
      group.name = sentGroup.name;
    }

    if (sentGroup.description) {
      group.description = sentGroup.description;
    }

    if (sentGroup.ownerId) {
      const newOwner = await findUserById(sentGroup.ownerId);
      if (newOwner === null) {
        res.status(404).send({error: `User with id ${sentGroup.ownerId} not found. (ownerId)`});
        return;
      }
      group.owner = newOwner;
    }

    if (sentGroup.membersIDs) {
      const {validUsers, notFoundUsersIDs} = await checkUserIdArray(sentGroup.membersIDs);
      if (notFoundUsersIDs.length > 0) {
        const plural = notFoundUsersIDs.length > 1 ? 's' : '';
        res.status(404).send({error: `User${plural} with ID${plural} ${notFoundUsersIDs} not found. (newMembersIDs)`});
        return;
      }
      group.members = validUsers;
    }

    if (sentGroup.newMembersIDs !== undefined && sentGroup.newMembersIDs.length > 0) {
      const {validUsers, notFoundUsersIDs} = await checkUserIdArray(sentGroup.newMembersIDs);

      if (notFoundUsersIDs.length > 0) {
        const plural = notFoundUsersIDs.length > 1 ? 's' : '';
        res.status(404).send({error: `User${plural} with ID${plural} ${notFoundUsersIDs} not found. (newMembersIDs)`});
        return;
      }
      group.members.push(...validUsers);
    }

    if (sentGroup.removedMembersIDs !== undefined && sentGroup.removedMembersIDs.length > 0) {
      const {notFoundUsersIDs} = await checkUserIdArray(sentGroup.removedMembersIDs);

      if (notFoundUsersIDs.length > 0) {
        const plural = notFoundUsersIDs.length > 1 ? 's' : '';
        res.status(404).send({error: `User${plural} with ID${plural} ${notFoundUsersIDs} not found. (removedMembersIDs)`});
        return;
      }

      group.members = group.members.filter(member => sentGroup.removedMembersIDs?.indexOf(member.id) === -1);
    }

    const groupUpdated = await groupRepo.save(group);
    res.status(200).send(groupUpdated);
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "internal error"});
  }
};

export const deleteMessageGroup = async (req: Request, res: Response) : Promise<void> => {
  try {
    const validated = messageGroupIdValidation.validate(req.params);
    if (validated.error) {
      res.status(400).send(generateValidationErrorMessage(validated.error.details));
      return;
    }

    const sentGroup = validated.value;
    const groupRepo = AppDataSource.getRepository(MessageGroup);
    const group = await groupRepo.findOne({where: {id: sentGroup.id}, relations: ["owner", "members", "messages"]});
    if (group === null) {
      res.status(404).send({"error": `Group with id ${sentGroup.id} not found.`});
      return;
    }

    const currentUser = (req as any).user
    if (currentUser.role !== 1 && currentUser.userId !== group.owner.id) {
      res.status(401).send({error: "Forbidden"});
      return;
    }

    const deleted = await groupRepo.remove(group);
    res.status(200).send(deleted);
  } catch (error) {
    console.log(error);
    res.status(500).send({error: "internal error"});
  }
};

export const findMessageGroupById = (id :number) => {
  const groupRepo = AppDataSource.getRepository(MessageGroup);
  return groupRepo.findOne({where: {id}, relations: ["owner", "members", "messages"]});
};

export const findMessageGroupsByMemberId = (id: number) => {
  const groupRepo = AppDataSource.getRepository(MessageGroup);
  return groupRepo.createQueryBuilder("group")
    .leftJoin("group.members", "member")
    .where("member.id = :id", {id})
    .getMany();
}
