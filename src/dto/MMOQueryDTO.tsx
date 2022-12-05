export class MMOQueryDTO {

    mmoId: string;
    mmoType: number;
    extension: string;
    mmoData: string;
    context: MMOContextDTO;
    semantic?: MMOSemanticDTO;
    relationships?: Array<MMORelationshipDTO>;


    constructor(mmoId: string, mmoType: number, extension: string, mmoData: string, context: MMOContextDTO, semantic: MMOSemanticDTO, relationships: Array<MMORelationshipDTO>) {
        this.mmoId = mmoId;
        this.mmoType = mmoType;
        this.extension = extension;
        this.mmoData = mmoData;
        this.context = context;
        this.semantic = semantic;
        this.relationships = relationships;
    }

}

export class MMOContextDTO {
    contextId: string;
    value: string;
    mmoId: string;

    constructor(contextId: string, value: string, mmoId: string) {
        this.contextId = contextId;
        this.value = value;
        this.mmoId = mmoId;
    }
}

export class MMOSemanticDTO {
    semanticId?: string;
    entity?: string;
    location?: string;
    date?: string;
    object?: string;
    time?: string;
    event?: string;
    mmoId?: string;

    constructor(semanticId: string, entity: string, location: string, date: string, object: string, time: string, event: string, mmoId: string) {
        this.semanticId = semanticId;
        this.entity = entity;
        this.location = location;
        this.date = date;
        this.object = object;
        this.time = time;
        this.event = event;
        this.mmoId = mmoId;
    }
}

export class MMORelationshipDTO {
    relationshipId: string;
    relationshipType: string;
    firsthandOperator: string;
    secondhandOperator: string;
    operationType: string;
    mmoId: string;

    constructor(relationshipId: string, relationshipType: string, firsthandOperator: string, secondhandOperator: string, operationType: string, mmoId: string) {
        this.relationshipId = relationshipId;
        this.relationshipType = relationshipType;
        this.firsthandOperator = firsthandOperator;
        this.secondhandOperator = secondhandOperator;
        this.operationType = operationType;
        this.mmoId = mmoId;
    }
}