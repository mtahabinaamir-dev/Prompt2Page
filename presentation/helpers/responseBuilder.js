const projectState = require("../../application/state/ProjectState");
const pageState = require("../../application/state/PageState");

function success(reply, data = {}, refreshPreview = true) {

    let activeProject = null;
    let activePage = null;
    let projectsList = [];
    let pagesList = [];

    try {

        const container = require("../../bootstrap/container");
        const projectRepo = container.get("ProjectRepository");
        const pageRepo = container.get("PageRepository");

        const activeProjObj = projectState.get();

        if (activeProjObj) {

            activeProject = activeProjObj.name || activeProjObj.id;

            try {

                const pageObjs = pageRepo.findByProjectId(activeProjObj.id);

                pagesList = pageObjs.map(p => p.name || p.id);

            } catch (err) {}

        }

        const activePgObj = pageState.get();

        if (activePgObj) {

            activePage = activePgObj.name || activePgObj.id;

        }

        try {

            const projObjs = projectRepo.findAll();

            projectsList = projObjs.map(p => p.name || p.id);

        } catch (err) {}

    } catch (err) {}

    const isRef = Boolean(refreshPreview);

    const payload = {
        ...data,
        refreshPreview: isRef,
        activeProject: activeProject,
        activePage: activePage
    };

    if (!payload.projects) {

        payload.projects = projectsList;

    }

    if (!payload.pages) {

        payload.pages = pagesList;

    }

    return {
        success: true,
        reply,
        refreshPreview: isRef,
        activeProject: activeProject,
        activePage: activePage,
        projects: payload.projects,
        pages: payload.pages,
        data: payload
    };

}

function failure(reply) {

    return {
        success: false,
        reply,
        refreshPreview: false,
        activeProject: null,
        activePage: null,
        projects: [],
        pages: [],
        data: {
            refreshPreview: false
        }
    };

}

module.exports = {
    success,
    failure
};