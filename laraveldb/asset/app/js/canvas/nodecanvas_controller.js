DesignerApp.module("NodeCanvas.Controller", function(Controller, DesignerApp, Backbone, Marionette, $, _, Hello) {


    var authenticated = false;
    var OAUTH_PROXY_URL = 'https://auth-server.herokuapp.com/proxy';
    var DROPBOX_CLIENT_ID = 'p2vlq3qzsirlzc0';
    var GITHUB_CLIENT_ID = '25bbf727cf799dcb1081';

    hello.init({
        'dropbox': DROPBOX_CLIENT_ID,
        'github': GITHUB_CLIENT_ID
    }, {
        oauth_proxy: OAUTH_PROXY_URL
    });

    hello.on('auth.login', function(r) {
        authenticated = true;
    });


    hello.services.github.post = hello.services.github.post || {};
    hello.services.github.post['default'] = function(p, callback) {
        p.data = JSON.stringify(p.data);
        p.headers = {
            'content-type': 'application/x-www-form-urlencoded'
        };
        callback(p.path);
    };

    // INIT CANVAS

    var viewNodeCanvas = new DesignerApp.NodeCanvas.Views.NodeCanvas({
        collection: DesignerApp.NodeEntities.getNodeCanvas()
    });

    //
    //
    //  MAIN CANVAS
    //
    //

    viewNodeCanvas.on("canvas:createcontainer", function() {

        var container = DesignerApp.NodeEntities.getNewNodeContainer();
        console.log(container);
        var view = new DesignerApp.NodeModule.Modal.CreateNodeContainer({
            model: container
        });

        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.on("okClicked", function(data) {
            if (container.set(data, {
                validate: true
            })) {
                data.position = {
                    x: 100,
                    y: 100
                };
                DesignerApp.NodeEntities.AddNewNode(data);
            } else {
                view.trigger("formDataInvalid", container.validationError);
                modal.preventClose();
            }
        });

    });


    viewNodeCanvas.on("canvas:open", function() {
        $("#fileOpenDialog").trigger("click");
    });

    viewNodeCanvas.on("canvas:save", function() {
        $("#fileSaveDialog").trigger("click");
    });

    viewNodeCanvas.on("canvas:generate", function() {

        var view = new DesignerApp.NodeModule.Modal.Generate({
            content: DesignerApp.NodeEntities.GenerateCode()
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

    });

    //
    //
    //  CHILD NODES
    //
    //

    viewNodeCanvas.on("childview:container:editcontainer", function(childview) {
        var containerModel = childview.model;
        var view = new DesignerApp.NodeModule.Modal.EditNodeContainer({
            model: containerModel
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.listenTo(view, "okClicked", function(data) {
            //console.log(data);
            if (containerModel.set(data, {
                validate: true
            })) {
                //DesignerApp.NodeEntities.AddNewNode(data);
            } else {
                view.trigger("formDataInvalid", containerModel.validationError);
                modal.preventClose();
            }
        });



    });




    viewNodeCanvas.on("childview:container:addrelation", function(childview) {
        //var relation = DesignerApp.request("nodeentities:new:relation");
        //need model, parent
        //model = childview.model
        //parent = ? nodeentities:canvas

        var view = new DesignerApp.NodeModule.Modal.CreateRelation({
            model: childview.model
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.listenTo(view, "okClicked", function(data) {
            var new_rel = DesignerApp.NodeEntities.getNewRelationModel();
            if (new_rel.set(data, {
                validate: true
            })) {
                var relation = childview.model.get("relation");
                relation.add(new_rel);
                DesignerApp.NodeEntities.AddRelation(childview.model, new_rel);
                console.log(new_rel);
            } else {
                view.trigger("formDataInvalid", new_rel.validationError);
                modal.preventClose();
                console.log("error");
            }
        });

        modal.on("hidden", function() {
            modal.off();
            view.remove();
        });

    });

    viewNodeCanvas.on("childview:container:viewrelation", function(childview) {

        var view = new DesignerApp.NodeModule.Modal.ViewRelations({
            model: childview.model
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.on("addNewRelationClicked", function() {
            viewNodeCanvas.trigger("childview:container:addrelation", childview);
            modal.preventClose();
        });

    });

    viewNodeCanvas.on("childview:container:deletecontainer", function(childview) {
        //todo refactor
        var test = childview.model.get("relation");
        var model;
        while (model = test.first()) {
            model.destroy();
        }
        test = childview.model.get("column");
        while (model = test.first()) {
            model.destroy();
        }
        childview.model.destroy();
    });


    viewNodeCanvas.on("childview:container:addnewitem", function(childview) {

        var view = new DesignerApp.NodeModule.Modal.CreateNodeItem({
            model: DesignerApp.request("nodeentities:new:nodeitem")
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);
        view.on("okClicked", function(data) {
            childview.collection.add(data);
        });

    });

    viewNodeCanvas.on("childview:container:nodeitem:delete", function(childview, itemview) {
        itemview.model.destroy();
    });

    viewNodeCanvas.on("childview:container:nodeitem:edit", function(childview, itemview) {
        var view = new DesignerApp.NodeModule.Modal.EditNodeItem({
            model: itemview.model
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.on("okClicked", function(data) {
            itemview.model.set(data);
        });


    });

    viewNodeCanvas.on("childview:container:seeding", function(childview) {

        var nodeContainer = childview.model;
        var nodeItem = nodeContainer.get("column");
        var nodeSeeding = nodeContainer.get("seeding");


        // var seeding = [];

        //nodeSeeding.each(function(seed){
        //    var newseed = {};
        //    nodeItem.each(function(nodecolumn){
        //        var s = seed.get("column").findWhere({cid: nodecolumn.cid});
        //        if(s)
        //        {
        //            newseed[nodecolumn.get("name")] = s.get("content");
        //        }
        //    });
        //    seeding.push(newseed);
        //});


        var view = new DesignerApp.NodeModule.Modal.Seeding({
            model: childview.model.get("column"),
            seeding: nodeContainer.getSeeding(),
            parentNode: nodeContainer
        });

        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.listenTo(view, "delClicked", function(data) {
            data.destroy();
            nodeContainer.set("seeding", view.seeding);
            //console.log("wedew");
        });

        view.listenTo(view, "okClicked", function(data) {

            var seed = new DesignerApp.NodeEntities.SeedTableCollection();

            _.each(data, function(value, key) {
                var key_to_colid = nodeItem.findWhere({
                    name: key
                }).get("colid");
                console.log(key_to_colid);

                seed.get("column").add({
                    colid: key_to_colid,
                    content: value
                });

            });

            view.seeding.add(seed);
            //nodeSeeding.add(seed);
            nodeContainer.set("seeding", view.seeding);

            modal.preventClose();
        });

        modal.on("hidden", function() {
            //console.log("hidden");
            nodeContainer.set("seeding", view.seeding);
            view.seedview.destroy();
            view.remove();
        });



    });

    //todo refactor
    DesignerApp.commands.setHandler("nodecanvas:edit:relation", function(a, b) {

        var view = new DesignerApp.NodeModule.Modal.EditRelationItem({
            model: b
        }, {
            container: a
        });
        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.on("okClicked", function(data) {
            if (b.set(data, {
                validate: true
            })) {

            } else {
                view.trigger("formDataInvalid", b.validationError);
                modal.preventClose();
            }
        });

        view.on("delClicked", function(model) {
            model.destroy();
        });

        //console.log("Wew");

    });

    //todo: refactor this
    DesignerApp.commands.setHandler("nodecanvas:create:relation", function(containerModel, targetId) {

        var targetName = DesignerApp.NodeEntities.getNodeContainerFromNodeCid(targetId).get("name");

        var view = new DesignerApp.NodeModule.Modal.CreateRelation({
            model: containerModel,
            target: targetName
        });

        var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

        view.listenTo(view, "okClicked", function(data) {
            var new_rel = DesignerApp.NodeEntities.getNewRelationModel();
            if (new_rel.set(data, {
                validate: true
            })) {
                var relation = containerModel.get("relation");
                relation.add(new_rel);
                DesignerApp.NodeEntities.AddRelation(containerModel, new_rel);
                // console.log(new_rel);
            } else {
                view.trigger("formDataInvalid", new_rel.validationError);
                modal.preventClose();
                // console.log("error");
            }
        });

    });


    viewNodeCanvas.on("canvas:savegist", function() {
        //console.log(hello);


        var saveGist = function(fileName) {
            var json_post = {
                "description": "created with LaravelDBDesigner",
                "public": true,
                "files": {
                    fileName: {
                        "content": JSON.stringify(DesignerApp.NodeEntities.ExportToJSON())
                    }
                }
            };

            var github = hello("github");

            github.api('/gists', 'post', json_post).then(function(resp) {
                //console.log(resp);
            });

        };

        var modalSave = function() {

            var view = new DesignerApp.NodeModule.Modal.SaveToCloud({});
            var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);

            view.listenTo(view, "okClicked", function(fileName) {
                saveGist(fileName);
            });
        };

        if (!authenticated) {
            hello.login("github", {
                scope: "gist"
            });
        } else {
            modalSave();
        }

    });

    viewNodeCanvas.on("canvas:loadgist", function() {
        var view = new DesignerApp.NodeModule.Modal.LoadFromCloud({});

        var loadDropboxData = function(gistId) {
            var github = hello("github");            
            github.api('/gists/' + gistId , 'get').then(function(resp) {
                  var jsonfile = (JSON.parse(resp.files.fileName.content));
                  DesignerApp.NodeEntities.ClearNodeCanvas(DesignerApp.NodeEntities.getNodeCanvas());
                  DesignerApp.NodeEntities.AddNodeCanvas(jsonfile);
            });
        };

        view.listenTo(view, "okClicked", function(fileName) {
            loadDropboxData(fileName);
        });

        if (!authenticated) {
            hello.login("github", {
                scope: "gist"
            });
        } else {
            var modal = DesignerApp.NodeModule.Modal.CreateTestModal(view);
        }

    });

    //
    //  LAUNCH
    //

    DesignerApp.mainContent.show(viewNodeCanvas);

});