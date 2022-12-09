import React, {Fragment, useEffect, useRef, useState} from 'react';
import UploadPage from "./pages/UploadPage";
import {ActivePage} from "./utils/ActivePage";
import { Tab } from '@headlessui/react'
import { Dialog } from '@headlessui/react'
import {MMODTO, RelationshipDTO} from "./dto/MMODTO";
import { Combobox, Listbox, Transition  } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import toast, {Toaster} from "react-hot-toast";
import {MMOQueryDTO} from "./dto/MMOQueryDTO";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import createSpeechlySpeechRecognition from "@speechly/speech-recognition-polyfill/dist/createSpeechRecognition";


var cloneDeep = require('lodash.clonedeep');
var isEqual = require('lodash.isequal');

const  {REACT_APP_DEV_MDIP_API_URL} = process.env

function App() {

    const [mmo, setMMO] = useState<MMODTO>(
        new MMODTO("", "", undefined, "", "", "", "", "", "", []));

    const [annotation, setAnnotation] = useState<boolean>(false);

    const [searchModule, setSearchModule] = useState<boolean>(false);

    const [relationship, setRelationship] = useState<RelationshipDTO>(new RelationshipDTO("", "", "",""));
    const [relationshipCreator, setRelationshipCreator] = useState<boolean>(false);
    const [queryRelationshipCreator, setQueryRelationshipCreator] = useState<boolean>(false);

    const relationshipTypes = ["Semantic", "Spatial", "Temporal"]

    const [queryText, setQueryText] = useState<string>("");

    const [queryData, setQueryData] = useState<MMOQueryDTO[]>([]);


    const [contextList, setContextList] = useState<string[]>([]);
    const [entityList, setEntityList] = useState<string[]>([]);
    const [locationList, setLocationList] = useState<string[]>([]);
    const [objectList, setObjectList] = useState<string[]>([]);
    const [eventList, setEventList] = useState<string[]>([]);
    const [operationList, setOperationList] = useState<string[]>([]);

    const [query, setQuery] = useState('')

    const filteredList = (list: string[]) : string[] => {
        return query === ''
            ? list
            : list.filter((data) =>
                data
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .includes(query.toLowerCase().replace(/\s+/g, ''))
            )
    }

    const hiddenFileInput = useRef(null);

    const handleClick = (event: any) => {
        if(hiddenFileInput != null) {
            // @ts-ignore
            hiddenFileInput.current.click();
        }
    };

    const selectFile = (event: any) => {
        let extensions = ["jpg", "jpeg", "gif", "png", "bmp", "svg"];

        let file = event.target.files[0];
        let isValid = false;

        for(const ext of extensions) {
            if(file.type === "image/" + ext) {
                isValid = true;
                break;
            }
        }

        if(!isValid) {
            toast.error("Invalid file type.")
            return;
        }

        setMMO({
            ...mmo,
            file: event.target.files[0]
        })
    };

      function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ')
    }

    const uploadMMO = async () => {

        toast.dismiss();
        toast.loading("Uploading MMO...");

        let formData = new FormData();

        formData.append('MmoType', '0');
        formData.append('MmoFile', mmo.file);
        formData.append('Context', mmo.context);

        if(mmo.entity != "")
            formData.append('Semantic.Entity', mmo.entity);

        if(mmo.location != "")
            formData.append('Semantic.Location', mmo.location);

        if(mmo.date != "")
            formData.append('Semantic.Date', mmo.date);

        if(mmo.object != "")
            formData.append('Semantic.Object', mmo.object);

        if(mmo.time != "")
            formData.append('Semantic.Time', mmo.time);

        if(mmo.event != "")
            formData.append('Semantic.Event', mmo.event);

        for (let i = 0; i < mmo.relationships.length; i++) {
            formData.append(
                `Relationships[${i}].relationshipType`,
                mmo.relationships[i].relationshipType
            );

            formData.append(
                `Relationships[${i}].firsthandOperator`,
                mmo.relationships[i].firsthandOperator
            );

            formData.append(
                `Relationships[${i}].secondhandOperator`,
                mmo.relationships[i].secondhandOperator
            );

            formData.append(
                `Relationships[${i}].operationType`,
                mmo.relationships[i].operationType
            );
        }

        const resp = await fetch(REACT_APP_DEV_MDIP_API_URL + `mmo/upload`,
            {
                body: formData,
                method: "POST",
                headers: {
                    "accept": "application/json"
                },
            });

        toast.dismiss();

        if (!resp.ok) {
            toast.error("An internal error occured whilst uploading.")
            console.log(resp.statusText)
            return;
        }

        const data = await resp.json();
        console.log(data)

        toast.success("Successfully uploaded MMO.")
    };

    const search = async () => {
        toast.dismiss();
        toast.loading("Searching for MMOs...");

        const resp = await fetch(REACT_APP_DEV_MDIP_API_URL + `mmo/search`,
            {
                body: JSON.stringify({
                    mmoType: 0,
                    context: mmo.context,
                    semanticSearchModel: {
                        entity: mmo.entity,
                        location: mmo.location,
                        date: mmo.date,
                        object: mmo.object,
                        time: mmo.time,
                        event: mmo.event,
                    },
                    relationshipSearchModels: mmo.relationships
                }),
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "Content-Type": "application/json"
                },
            });

        toast.dismiss();

        if (!resp.ok) {
            toast.error("An internal error occured whilst uploading.")
            console.log(resp.statusText)
            return;
        }

        const data = await resp.json();
        setQueryData(data.data);

        if(data.data.length == 0)
            toast.error("No images found validating query.");
        else
            toast.success("Successfully queried MMO.")
    };

    const reloadQueryOptions = async () => {
        toast.dismiss();
        toast.loading("Loading query data...");

        const resp = await fetch(REACT_APP_DEV_MDIP_API_URL + `mmo/query/data`,
            {
                method: "GET",
                headers: {
                    "accept": "application/json"
                },
            });

        const data = await resp.json();

        setContextList(data.data.contexts);
        setEntityList(data.data.entities);
        setLocationList(data.data.locations);
        setObjectList(data.data.objects);
        setEventList(data.data.events);
        setOperationList(data.data.operations);

        toast.dismiss();
        toast.success("Successfully fetched details.")
    };

    const updateQueryField = () => {
        let field = "Context:" + mmo.context;

        if(mmo.entity != "")
            field += ";Entity:" + mmo.entity;

        if(mmo.location != "")
            field += ";Location:" + mmo.location;

        if(mmo.object != "")
            field += ";Object:" + mmo.object;

        if(mmo.date != "")
            field += ";Date:" + mmo.date;

        if(mmo.time != "")
            field += ";Time:" + mmo.time;

        if(mmo.event != "")
            field += ";Event:" + mmo.event;

        mmo.relationships.forEach((rel: RelationshipDTO) => field += ";Relationship=" + rel.firsthandOperator + "_" + rel.operationType + "_" + rel.secondhandOperator + "#" + rel.relationshipType);

        setQueryText(field);
    };

    const commands = [
        {
            command: 'clear',
            callback: () => setMMO(new MMODTO("", "", undefined, "", "", "", "", "", "", [])),
            isFuzzyMatch: true,
            fuzzyMatchingThreshold: 0.2
        }
    ]

    const [currentVoiceField, setCurrentVoiceField] = useState<string>("");
    const {listening, resetTranscript, transcript, browserSupportsSpeechRecognition } = useSpeechRecognition({ commands })

    if (!browserSupportsSpeechRecognition) {
        toast.error("Your browser does not support speech recognition");
    }

    useEffect(() => {
        if(currentVoiceField == "") {
            resetTranscript();
            SpeechRecognition.stopListening();
        }

        if(currentVoiceField == "context")
            setMMO({
                ...mmo,
                context: transcript
            });

        if(currentVoiceField == "entity")
            setMMO({
                ...mmo,
                entity: transcript
            });

        if(currentVoiceField == "location")
            setMMO({
                ...mmo,
                location: transcript
            });

        if(currentVoiceField == "date")
            setMMO({
                ...mmo,
                date: transcript
            });

        if(currentVoiceField == "object")
            setMMO({
                ...mmo,
                object: transcript
            });

        if(currentVoiceField == "time")
            setMMO({
                ...mmo,
                time: transcript
            });

        if(currentVoiceField == "event")
            setMMO({
                ...mmo,
                event: transcript
            });
    }, [transcript]);

    return (
        <div className={`App w-full h-full flex flex-col bg-cover bg-gradient-to-r from-sky-400 to-blue-600 justify-between items-center`}>
            <Toaster/>
            <div className={`w-full h-full max-w-md px-2 py-16 sm:px-0`}>
                <Tab.Group onChange={() => {
                    setMMO(new MMODTO("", "", undefined, "", "", "", "", "", "", []));
                    setQueryData([]);

                    reloadQueryOptions();
                }}>
                    <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                        <Tab
                            key={"uploadImage"}
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                                    selected
                                        ? 'bg-white shadow'
                                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                )
                            }
                        >
                            Upload Image
                        </Tab>
                        <Tab
                            key={"searchImage"}
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                                    selected
                                        ? 'bg-white shadow'
                                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                )
                            }
                        >
                            Search Image
                        </Tab>
                    </Tab.List>
                    <Tab.Panels className="mt-2">
                        <Tab.Panel
                            key={"uploadImage"}
                            className={classNames(
                                'rounded-xl bg-white p-3',
                                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                            )}
                        >

                            <div className="flex flex-col items-center justify-center">
                                <p className={"font-gilroyBold text-xl my-2"}>Click the MMO to annotate after uploading it.</p>

                                <div className="flex flex-row h-[28rem] w-full rounded-2xl border-2 border-gray-300 items-center justify-center">
                                    {mmo.file == undefined &&
                                        <p onClick={handleClick} className={"text-blue-500 cursor-pointer"}>
                                            Upload an Image
                                        </p>
                                    }

                                    {mmo.file != undefined &&
                                        <img onClick={() => setAnnotation(true)} src={URL.createObjectURL(mmo.file)} className={"w-full h-full rounded-2xl"}/>
                                    }

                                    <input type="file" id="receipt" name="receipt" className={"hidden"} ref={hiddenFileInput} accept="image/png, image/gif, image/jpeg, image/bmp, image/svg" onChange={selectFile}></input>
                                </div>

                                {mmo.file != undefined &&
                                    <p onClick={handleClick} className={"text-blue-500 cursor-pointer pt-10"}>
                                        Upload another photo
                                    </p>
                                }

                                {mmo.file != undefined &&
                                    <button onClick={() => uploadMMO()}
                                            className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 mt-10 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200">
                                      <span
                                          className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                                          Create MMO
                                      </span>
                                    </button>
                                }
                            </div>

                        </Tab.Panel>

                        <Tab.Panel
                            key={"searchImage"}
                            className={classNames(
                                'overflow-y-auto rounded-xl bg-white p-3',
                                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                            )}
                        >
                            <div className={"overflow-y-auto overflow-x-hidden rounded-xl bg-white w-full h-16 flex flex-row items-center justify-between"}>
                                <i className="fa fa-search"></i>
                                <input
                                    type="text"
                                    className='border-solid border-2 border-gray-100 rounded-md h-6 w-80'
                                    disabled
                                    value={queryText}
                                />
                                <button className='flex bg-black h-6 w-6 rounded-lg hover:bg-gray-900 hover:scale-105 transition ease-in-out duration-300 items-center justify-center' onClick={() => {
                                    setSearchModule(true)
                                }}>
                                    <i className="fa-solid fa-hand-pointer text-sm text-white"></i>
                                </button>
                            </div>

                            <div className={"flex flex-row w-full h-12 items-center justify-center"}>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    onClick={() => {
                                        search();
                                    }}>

                                    Validate Search
                                </button>
                            </div>

                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
                <Transition appear show={annotation} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setAnnotation(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="relative w-[40rem] h-full transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="font-gilroyLight text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Annotation
                                        </Dialog.Title>

                                        <div className="mt-4">
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Context</p>
                                                <p className={"pl-2 font-gilroyLight text-red-500 text-sm"}>Required</p>
                                            </div>

                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.context}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            context: e.target.value
                                                        });
                                                    }
                                                    }
                                                />

                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "context" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "context") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("context")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>

                                            </div>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Entity</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>

                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.entity}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            entity: e.target.value
                                                        });
                                                    }
                                                    }
                                                />

                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "entity" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "entity") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("entity")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>
                                            </div>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Location</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>

                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.location}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            location: e.target.value
                                                        });
                                                    }
                                                    }
                                                />
                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "location" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "location") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("location")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>
                                            </div>
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Date</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.date}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            date: e.target.value
                                                        });
                                                    }
                                                    }
                                                />
                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "date" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "date") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("date")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>

                                            </div>
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Object</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.object}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            object: e.target.value
                                                        });
                                                    }
                                                    }
                                                />
                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "object" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "object") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("object")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>
                                            </div>
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Time</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.time}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            time: e.target.value
                                                        });
                                                    }
                                                    }
                                                />
                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "time" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "time") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("time")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>
                                            </div>
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Event</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm "}>Optional</p>
                                            </div>
                                            <div className={"flex flex-row justify-between items-center w-4/6 mt-2 mb-4"}>
                                                <input
                                                    type="text"
                                                    className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 pl-1'
                                                    required
                                                    value={mmo.event}
                                                    onChange={(e) => {
                                                        setMMO({
                                                            ...mmo,
                                                            event: e.target.value
                                                        });
                                                    }
                                                    }
                                                />
                                                <button className={`flex h-9 w-9 rounded-lg hover:scale-105 transition-all ease-in-out duration-300 items-center justify-center ${currentVoiceField == "event" ? 'bg-sky-400' : 'bg-black'}`} onClick={() => {
                                                    if(listening && currentVoiceField == "event") {
                                                        setCurrentVoiceField("");
                                                        resetTranscript();
                                                        return;
                                                    } else if(listening) {
                                                        resetTranscript();
                                                    } else if(!listening)
                                                        SpeechRecognition.startListening({continuous: true});

                                                    setCurrentVoiceField("event")
                                                }}>
                                                    <i className="fa-solid fa-microphone text-sm text-white"></i>
                                                </button>
                                            </div>
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Relationships</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 mx-5 px-7 py-2 text-xs font-gilroyLight text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                    onClick={() => setRelationshipCreator(true)}
                                                >
                                                    Create Relationship
                                                </button>
                                            </div>


                                            <table className="min-w-full leading-normal mt-5">
                                                <thead className={"relative z-20"}>
                                                <tr>
                                                    {["Type", "First Operator", "Operation Type", "Second Operator"].map((tableHeader: string) =>
                                                        <th key={tableHeader} className="sticky bg-white -top-6 pl-2 h-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            {tableHeader}
                                                        </th>
                                                    )}
                                                </tr>
                                                </thead>
                                                <tbody className="h-full overflow-y-auto z-10">
                                                {mmo.relationships!.map((relationship: RelationshipDTO) => (
                                                    <tr className="cursor-pointer">
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.relationshipType}
                                                        </td>
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.firsthandOperator}
                                                        </td>
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.operationType}
                                                        </td>
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.secondhandOperator}
                                                        </td>
                                                        <td onClick={() => {
                                                            let clonedArray = cloneDeep(mmo.relationships!);
                                                            clonedArray = clonedArray.filter((rel: RelationshipDTO) => !isEqual(rel, relationship));

                                                            setMMO({
                                                                ...mmo,
                                                                relationships: clonedArray
                                                            })
                                                        }} className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            <i className="fa-solid fa-x"></i>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={() => {

                                                    if(mmo.context == "") {
                                                        toast.dismiss();
                                                        toast.error("A context must be provided.");
                                                        return;
                                                    }

                                                    setAnnotation(false)
                                                }}
                                            >
                                                Save Annotation
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
                <Transition appear show={searchModule} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setSearchModule(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="relative w-[40rem] h-full transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="font-gilroyLight text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Search Query
                                        </Dialog.Title>

                                        <div className="mt-4">
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Context</p>
                                                <p className={"pl-2 font-gilroyLight text-red-500 text-sm"}>Required</p>
                                            </div>
                                            <Combobox value={mmo.context} onChange={(e) => {
                                                setMMO({
                                                    ...mmo,
                                                    context: e
                                                })
                                            }}>
                                                <div className="relative mt-1 mb-5">
                                                    <div className="relative w-80 h-10 cursor-default overflow-hidden border-solid border-2 border-gray-100 rounded-md bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                            onChange={(event) => setQuery(event.target.value)}
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
                                                            {contextList.length === 0 && query !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredList(contextList).map((context) => (
                                                                    <Combobox.Option
                                                                        key={context}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value={context}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                        <span
                            className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                            }`}
                        >
                          {context}
                        </span>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                            active ? 'text-white' : 'text-teal-600'
                                                                                        }`}
                                                                                    >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Entity</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <Combobox value={mmo.entity} onChange={(e) => {
                                                setMMO({
                                                    ...mmo,
                                                    entity: e
                                                })
                                            }}>
                                                <div className="relative mt-1 mb-5">
                                                    <div className="relative w-80 h-10 cursor-default overflow-hidden border-solid border-2 border-gray-100 rounded-md bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                            onChange={(event) => setQuery(event.target.value)}
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
                                                            {entityList.length === 0 && query !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredList(entityList).map((entity) => (
                                                                    <Combobox.Option
                                                                        key={entity}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value={entity}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                        <span
                            className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                            }`}
                        >
                          {entity}
                        </span>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                            active ? 'text-white' : 'text-teal-600'
                                                                                        }`}
                                                                                    >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Location</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <Combobox value={mmo.location} onChange={(e) => {
                                                setMMO({
                                                    ...mmo,
                                                    location: e
                                                })
                                            }}>
                                                <div className="relative mt-1 mb-5">
                                                    <div className="relative w-80 h-10 cursor-default overflow-hidden border-solid border-2 border-gray-100 rounded-md bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                            onChange={(event) => setQuery(event.target.value)}
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
                                                            {locationList.length === 0 && query !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredList(locationList).map((location) => (
                                                                    <Combobox.Option
                                                                        key={location}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value={location}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                        <span
                            className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                            }`}
                        >
                          {location}
                        </span>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                            active ? 'text-white' : 'text-teal-600'
                                                                                        }`}
                                                                                    >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Date</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={mmo.date}
                                                onChange={(e) => {
                                                    setMMO({
                                                        ...mmo,
                                                        date: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Object</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <Combobox value={mmo.object} onChange={(e) => {
                                                setMMO({
                                                    ...mmo,
                                                    object: e
                                                })
                                            }}>
                                                <div className="relative mt-1 mb-5">
                                                    <div className="relative w-80 h-10 cursor-default overflow-hidden border-solid border-2 border-gray-100 rounded-md bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                            onChange={(event) => setQuery(event.target.value)}
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
                                                            {objectList.length === 0 && query !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredList(objectList).map((object) => (
                                                                    <Combobox.Option
                                                                        key={object}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value={object}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                        <span
                            className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                            }`}
                        >
                          {object}
                        </span>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                            active ? 'text-white' : 'text-teal-600'
                                                                                        }`}
                                                                                    >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Time</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={mmo.time}
                                                onChange={(e) => {
                                                    setMMO({
                                                        ...mmo,
                                                        time: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Event</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                            </div>
                                            <Combobox value={mmo.event} onChange={(e) => {
                                                setMMO({
                                                    ...mmo,
                                                    event: e
                                                })
                                            }}>
                                                <div className="relative mt-1 mb-5">
                                                    <div className="relative w-80 h-10 cursor-default overflow-hidden border-solid border-2 border-gray-100 rounded-md bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                            onChange={(event) => setQuery(event.target.value)}
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
                                                            {eventList.length === 0 && query !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredList(eventList).map((event) => (
                                                                    <Combobox.Option
                                                                        key={event}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value={event}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                        <span
                            className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                            }`}
                        >
                          {event}
                        </span>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                            active ? 'text-white' : 'text-teal-600'
                                                                                        }`}
                                                                                    >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>

                                            <div className={"flex flex-row items-center"}>
                                                <p className="font-gilroy">Relationships</p>
                                                <p className={"pl-2 font-gilroyLight text-yellow-500 text-sm"}>Optional</p>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 mx-5 px-7 py-2 text-xs font-gilroyLight text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                    onClick={() => setQueryRelationshipCreator(true)}
                                                >
                                                    Query Relationship
                                                </button>
                                            </div>


                                            <table className="min-w-full leading-normal mt-5">
                                                <thead className={"relative z-20"}>
                                                <tr>
                                                    {["Type", "First Operator", "Operation Type", "Second Operator"].map((tableHeader: string) =>
                                                        <th key={tableHeader} className="sticky bg-white -top-6 pl-2 h-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            {tableHeader}
                                                        </th>
                                                    )}
                                                </tr>
                                                </thead>
                                                <tbody className="h-full overflow-y-auto z-10">
                                                {mmo.relationships!.map((relationship: RelationshipDTO) => (
                                                    <tr className="cursor-pointer">
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.relationshipType}
                                                        </td>
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.firsthandOperator}
                                                        </td>
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.operationType}
                                                        </td>
                                                        <td className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            {relationship.secondhandOperator}
                                                        </td>
                                                        <td onClick={() => {
                                                            let clonedArray = cloneDeep(mmo.relationships!);
                                                            clonedArray = clonedArray.filter((rel: RelationshipDTO) => !isEqual(rel, relationship));

                                                            setMMO({
                                                                ...mmo,
                                                                relationships: clonedArray
                                                            })
                                                        }} className="h-20 px-2 py-5 border-b border-gray-200 bg-white text-base">
                                                            <i className="fa-solid fa-x"></i>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={() => {

                                                    if(mmo.context == "") {
                                                        toast.dismiss();
                                                        toast.error("A context must be provided.");
                                                        return;
                                                    }

                                                    setSearchModule(false)
                                                    updateQueryField();
                                                }}
                                            >
                                                Save Query
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
                <Transition appear show={relationshipCreator} as={Fragment}>
                    <Dialog as="div" className="relative z-20" onClose={() => setRelationshipCreator(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="relative w-[40rem] h-full transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="font-gilroyLight text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Create a Relationship
                                        </Dialog.Title>

                                        <div className={"flex flex-col my-8"}>
                                            <p className="font-gilroy">Relationship Type</p>
                                            <Listbox value={relationship.relationshipType} onChange={(e) => {
                                                setRelationship({
                                                    ...relationship,
                                                    relationshipType: e
                                                })
                                            }}>
                                                <div className="relative mt-1">
                                                    <Listbox.Button className="relative w-1/4 h-[3rem] cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                                                        <span className="block truncate">{relationship.relationshipType}</span>
                                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                          <ChevronUpDownIcon
                                                              className="h-5 w-5 text-gray-400"
                                                              aria-hidden="true"
                                                          />
                                                        </span>
                                                    </Listbox.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <Listbox.Options className="absolute mt-1 max-h-60 w-1/4 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {relationshipTypes.map((rel, relIdx) => (
                                                                <Listbox.Option
                                                                    key={relIdx}
                                                                    className={({ active }) =>
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                            active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                                                        }`
                                                                    }
                                                                    value={rel}
                                                                >
                                                                    {({ selected }) => (
                                                                        <>
                                                                              <span
                                                                                  className={`block truncate ${
                                                                                      selected ? 'font-medium' : 'font-normal'
                                                                                  }`}
                                                                              >
                                                                                {rel}
                                                                              </span>
                                                                            {selected ? (
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            ))}
                                                        </Listbox.Options>
                                                    </Transition>
                                                </div>
                                            </Listbox>
                                        </div>

                                        <div className={"flex flex-col my-4"}>
                                            <p className="font-gilroy">Firsthand Operator</p>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={relationship.firsthandOperator}
                                                onChange={(e) => {
                                                    setRelationship({
                                                        ...relationship,
                                                        firsthandOperator: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                        </div>

                                        <div className={"flex flex-col my-4"}>
                                            <p className="font-gilroy">Operation Type</p>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={relationship.operationType}
                                                onChange={(e) => {
                                                    setRelationship({
                                                        ...relationship,
                                                        operationType: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                        </div>

                                        <div className={"flex flex-col my-4"}>
                                            <p className="font-gilroy">Secondhand Operator</p>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={relationship.secondhandOperator}
                                                onChange={(e) => {
                                                    setRelationship({
                                                        ...relationship,
                                                        secondhandOperator: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={() => {

                                                    if(relationship.relationshipType == "" || relationship.operationType == "" ||
                                                        relationship.firsthandOperator == "" || relationship.secondhandOperator == "") {
                                                        toast.dismiss();
                                                        toast.error("Relationship fields must not be empty.");
                                                        return;
                                                    }

                                                    let clonedArray = cloneDeep(mmo.relationships!);
                                                    clonedArray.push(relationship)

                                                    setMMO({
                                                        ...mmo,
                                                        relationships: clonedArray
                                                    })

                                                    setRelationshipCreator(false)
                                                    setRelationship(new RelationshipDTO("", "", "",""))
                                                }}
                                            >
                                                Save Relationship
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
                <Transition appear show={queryRelationshipCreator} as={Fragment}>
                    <Dialog as="div" className="relative z-20" onClose={() => setRelationshipCreator(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="relative w-[40rem] h-full transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="font-gilroyLight text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Create a Relationship
                                        </Dialog.Title>

                                        <div className={"flex flex-col my-8"}>
                                            <p className="font-gilroy">Relationship Type</p>
                                            <Listbox value={relationship.relationshipType} onChange={(e) => {
                                                setRelationship({
                                                    ...relationship,
                                                    relationshipType: e
                                                })
                                            }}>
                                                <div className="relative mt-1">
                                                    <Listbox.Button className="relative w-1/4 h-[3rem] cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                                                        <span className="block truncate">{relationship.relationshipType}</span>
                                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                          <ChevronUpDownIcon
                                                              className="h-5 w-5 text-gray-400"
                                                              aria-hidden="true"
                                                          />
                                                        </span>
                                                    </Listbox.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <Listbox.Options className="absolute mt-1 max-h-60 w-1/4 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {relationshipTypes.map((rel, relIdx) => (
                                                                <Listbox.Option
                                                                    key={relIdx}
                                                                    className={({ active }) =>
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                            active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                                                        }`
                                                                    }
                                                                    value={rel}
                                                                >
                                                                    {({ selected }) => (
                                                                        <>
                                                                              <span
                                                                                  className={`block truncate ${
                                                                                      selected ? 'font-medium' : 'font-normal'
                                                                                  }`}
                                                                              >
                                                                                {rel}
                                                                              </span>
                                                                            {selected ? (
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            ))}
                                                        </Listbox.Options>
                                                    </Transition>
                                                </div>
                                            </Listbox>
                                        </div>

                                        <div className={"flex flex-col my-4"}>
                                            <p className="font-gilroy">Firsthand Operator</p>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={relationship.firsthandOperator}
                                                onChange={(e) => {
                                                    setRelationship({
                                                        ...relationship,
                                                        firsthandOperator: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                        </div>

                                        <div className={"flex flex-col my-4"}>
                                            <p className="font-gilroy">Operation Type</p>
                                            <Combobox value={relationship.operationType} onChange={(e) => {
                                                setRelationship({
                                                    ...relationship,
                                                    operationType: e
                                                })
                                            }}>
                                                <div className="relative mt-1 mb-5">
                                                    <div className="relative w-80 h-10 cursor-default overflow-hidden border-solid border-2 border-gray-100 rounded-md bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                            onChange={(event) => setQuery(event.target.value)}
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
                                                            {operationList.length === 0 && query !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredList(operationList).map((operation) => (
                                                                    <Combobox.Option
                                                                        key={operation}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value={operation}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                        <span
                            className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                            }`}
                        >
                          {operation}
                        </span>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                            active ? 'text-white' : 'text-teal-600'
                                                                                        }`}
                                                                                    >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>
                                        </div>

                                        <div className={"flex flex-col my-4"}>
                                            <p className="font-gilroy">Secondhand Operator</p>
                                            <input
                                                type="text"
                                                className='border-solid border-2 border-gray-100 rounded-md h-9 w-80 mt-1 mb-5 pl-1'
                                                required
                                                value={relationship.secondhandOperator}
                                                onChange={(e) => {
                                                    setRelationship({
                                                        ...relationship,
                                                        secondhandOperator: e.target.value
                                                    });
                                                }
                                                }
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={() => {

                                                    if(relationship.relationshipType == "" || relationship.operationType == "" ||
                                                        relationship.firsthandOperator == "" || relationship.secondhandOperator == "") {
                                                        toast.dismiss();
                                                        toast.error("Relationship fields must not be empty.");
                                                        return;
                                                    }

                                                    let clonedArray = cloneDeep(mmo.relationships!);
                                                    clonedArray.push(relationship)

                                                    setMMO({
                                                        ...mmo,
                                                        relationships: clonedArray
                                                    })

                                                    setQueryRelationshipCreator(false)
                                                    setRelationship(new RelationshipDTO("", "", "",""))
                                                }}
                                            >
                                                Save Relationship Query
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>

            {queryData.length == 0 &&
                <div className={"flex grow flex-wrap w-full h-full items-center gap-24 px-10 py-10 h-96 w-full"}>
                </div>
            }

            <div className={"flex grow flex-wrap w-full h-full items-center gap-24 px-10 py-10"}>
                {queryData.length != 0 &&
                    queryData.map((mmoQuery: MMOQueryDTO) => (
                        <div
                            className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                            <a href="#">
                                <img className="rounded-t-lg w-[24rem] h-[20rem]" src={"data:image/" + mmoQuery.extension.replaceAll(".", "") + ";base64," + mmoQuery.mmoData} alt=""/>
                            </a>
                            <div className="p-5">
                                <a href="#">
                                    <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Context: {mmoQuery.context.value}</h5>
                                </a>
                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                    Semantic Entity: {mmoQuery.semantic != null ? (mmoQuery.semantic!.entity != null ? mmoQuery.semantic!.entity : 'Not Defined') : 'Not Defined'}
                                </p>

                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                    Semantic Location: {mmoQuery.semantic != null ? (mmoQuery.semantic!.location != null ? mmoQuery.semantic!.location : 'Not Defined') : 'Not Defined'}
                                </p>

                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                    Semantic Date: {mmoQuery.semantic != null ? (mmoQuery.semantic!.date != null ? mmoQuery.semantic!.date : 'Not Defined') : 'Not Defined'}
                                </p>

                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                    Semantic Object: {mmoQuery.semantic != null ? (mmoQuery.semantic!.object != null ? mmoQuery.semantic!.object : 'Not Defined') : 'Not Defined'}
                                </p>

                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                    Semantic Time: {mmoQuery.semantic != null ? (mmoQuery.semantic!.time != null ? mmoQuery.semantic!.time : 'Not Defined') : 'Not Defined'}
                                </p>

                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                    Semantic Event: {mmoQuery.semantic != null ? (mmoQuery.semantic!.event != null ? mmoQuery.semantic!.event : 'Not Defined') : 'Not Defined'}
                                </p>

                                {mmoQuery.relationships != null &&
                                    mmoQuery.relationships!.map((relationship: RelationshipDTO) => (
                                        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                            Relationship: {relationship.relationshipType + " " + relationship.firsthandOperator + " " + relationship.operationType + " " + relationship.secondhandOperator}
                                        </p>
                                    ))
                                }
                            </div>
                        </div>
                    ))
                }

            </div>

        </div>
    );
}

export default App;