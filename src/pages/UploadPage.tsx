import React, {useEffect, useState} from "react";

function UploadPage() {

    return (
        <div className="flex flex-col w-1/2 h-1/2 items-center justify-center mx-20 my-20 bg-indigo-700 rounded-3xl">

            <p className={"font-gilroyBold"}>Please upload an image/sound/video and annotate it below: </p>

            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="small_size">Small
                file input</label>
            <input
                className="block w-full mb-5 text-xs text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                id="small_size" type="file"/>
        </div>
    );
}

export default UploadPage;