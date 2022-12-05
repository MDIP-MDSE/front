export class MMODTO {
    mmoType: string;
    context: string;
    file: any;
    entity: string;
    location : string;
    date: string;
    object: string;
    time: string;
    event: string;
    relationships: Array<RelationshipDTO>

    constructor(mmoType: string, context: string, file: any, entity: string, location: string, date: string, object: string, time: string, event: string, relationships: Array<RelationshipDTO>) {
        this.mmoType = mmoType;
        this.context = context;
        this.file = file;
        this.entity = entity;
        this.location = location;
        this.date = date;
        this.object = object;
        this.time = time;
        this.event = event;
        this.relationships = relationships;
    }
}

export class RelationshipDTO {
    relationshipType: string;
    firsthandOperator: string;
    secondhandOperator: string;
    operationType: string;

    constructor(relationshipType: string, firsthandOperator: string, secondhandOperator: string, operationType: string) {
        this.relationshipType = relationshipType;
        this.firsthandOperator = firsthandOperator;
        this.secondhandOperator = secondhandOperator;
        this.operationType = operationType;
    }
}