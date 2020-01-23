nhn.husky.SE_OnClick = jindo.$Class({
    name : "SE_OnClick",
    sATagMarker : "HTTP://HUSKY_TMP.MARKER/", // 생성 시 새로만드는 a태그임을 확인하는 용도

    $init : function(elAppContainer){
        this._assignHTMLObjects(elAppContainer);
    },  

    $LOCAL_BEFORE_FIRST : function(sMsg){
		if(sMsg.match(/(REGISTER_CONVERTERS)/)){
			this.oApp.acceptLocalBeforeFirstAgain(this, true);
			return true;
		}

		this._assignHTMLObjects(this.oApp.htOptions.elAppContainer);
        this.sRXATagMarker = this.sATagMarker.replace(/\//g, "\\/").replace(/\./g, "\\.");
        
		this.oApp.registerBrowserEvent(this.oBtnConfirm, "click", "APPLY_ONCLICK");
		this.oApp.registerBrowserEvent(this.oBtnCancel, "click", "SE_TOGGLE_ONCLICK_LAYER");
		this.oApp.registerBrowserEvent(this.oInput, "keydown", "ON_EVENT_ONCLICK_KEYDOWN");
	},

    _assignHTMLObjects : function(elAppContainer){
        this.oOnClickWrap = cssquery.getSingle("li.husky_seditor_ui_OnClick", elAppContainer);
        this.oDropdownLayer = cssquery.getSingle("div.se2_layer", this.oOnClickWrap);

		this.oInput = cssquery.getSingle("INPUT[type=text]", this.oDropdownLayer);
        this.oBtnConfirm = cssquery.getSingle(".se2_apply", this.oDropdownLayer);
        this.oBtnCancel = cssquery.getSingle(".se2_cancel", this.oDropdownLayer);
    },

    $ON_MSG_APP_READY : function(){
        this.bLayerShown = false;

        if (jindo.$Agent().os().mac) {
			this.oApp.exec("REGISTER_HOTKEY", ["meta+q", "SE_TOGGLE_ONCLICK_LAYER", []]);
		} else {
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+q", "SE_TOGGLE_ONCLICK_LAYER", []]);
        }

        this.oApp.exec("REGISTER_UI_EVENT", ["OnClick", "click", "SE_TOGGLE_ONCLICK_LAYER"]);
    },

    $ON_SE_TOGGLE_ONCLICK_LAYER : function(){
        if(!this.bLayerShown){
			this.oApp.exec("IE_FOCUS", []);
			this.oSelection = this.oApp.getSelection();
        }
        
		this.oApp.delayedExec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.oDropdownLayer, null, "MSG_ONCLICK_LAYER_SHOWN", [], "MSG_ONCLICK_LAYER_HIDDEN", [""]], 0);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['onclick']);
    },

    $ON_EVENT_ONCLICK_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.oApp.exec("APPLY_ONCLICK");
			oEvent.stop();
		}
	},

    $ON_MSG_ONCLICK_LAYER_SHOWN : function(){
        this.bLayerShown = true;
        var oAnchor = this.oSelection.findAncestorByTagName("A");

		if (!oAnchor) {
            oAnchor = this._getSelectedNode();
        }
        
        // 수정함
		if(oAnchor && !this.oSelection.collapsed){
			this.oSelection.selectNode(oAnchor);
			this.oSelection.select();

            this.bModify = true;

            
		}else{
            //수정안함
            this.oInput.value = '';
			this.bModify = false;
        }
        
		this.oApp.delayedExec("SELECT_UI", ["OnClick"], 0);
		this.oInput.focus();
        
		this.oInput.value = '';
		this.oInput.select();

    },

	$ON_MSG_ONCLICK_LAYER_HIDDEN : function(){
        this.bLayerShown = false;
		this.oApp.exec("DESELECT_UI", ["OnClick"]);
        
    },

    $ON_APPLY_ONCLICK : function(){
        var sVal = this.oInput.value;

        // 빈 값이나 타겟이 없을 경우
        if(sVal === '' || this.oSelection.collapsed) {
            alert('타겟이나 정보가 없습니다.\n확인해주세요.');
            return false;
        }

        var oAgent = jindo.$Agent().navigator();
		this.oApp.exec("IE_FOCUS", []);
        var sBM;
        
        sBM = this.oSelection.placeStringBookmark();
        this.oSelection.select();
        
        // 방금 생성된 a태그 구분
        var nSession = Math.ceil(Math.random()*10000);

        if(this._isExceptional()){
            console.log('??');
            
            var sTempUrl = "<a onclick='" + sVal + "'>";

            jindo.$A(this.oSelection.getNodes(true)).forEach(function(value){
                var oEmptySelection = this.oApp.getEmptySelection();

                if(value.nodeType === 3){
                    oEmptySelection.selectNode(value);
                    oEmptySelection.pasteHTML(sTempUrl + value.nodeValue + "</a>");
                }else if(value.nodeType === 1 && value.tagName === "IMG"){
                    oEmptySelection.selectNode(value);
                    oEmptySelection.pasteHTML(sTempUrl + jindo.$Element(value).outerHTML() + "</a>");
                }
            }, this);

        }else{
            this.oApp.exec("EXECCOMMAND", ["createLink", false, this.sATagMarker + nSession+encodeURIComponent(sVal), {bDontAddUndoHistory: true}]);
        }

        var oDoc = this.oApp.getWYSIWYGDocument();
        var aATags = oDoc.body.getElementsByTagName("A");
        var nLen = aATags.length;
        var rxMarker = new RegExp(this.sRXATagMarker+nSession, "gi");
        var elATag;

        for(var i=0; i<nLen; i++){
            elATag = aATags[i];

            var sVal = "";
            try{
                sVal = elATag.getAttribute("href");

            }catch(e){/**/}
            if (sVal && sVal.match(rxMarker)) {
                var sNewVal = sVal.replace(rxMarker, "");
                var sDecodeHref = decodeURIComponent(sNewVal);

                if(oAgent.ie){
                    jindo.$Element(elATag).attr({
                        "onclick" : sDecodeHref
                    });
                    elATag.removeAttribute('href');

                }else{
                    var sAContent = jindo.$Element(elATag).html();
                    jindo.$Element(elATag).attr({
                        "onclick" : sDecodeHref
                    });

                    elATag.removeAttribute('href');
                }
            }
        }
        
        this.oApp.exec("HIDE_ACTIVE_LAYER");

        setTimeout(jindo.$Fn(function(){
            var oSelection = this.oApp.getEmptySelection();
            oSelection.moveToBookmark(sBM);
            oSelection.collapseToEnd();
            oSelection.select();
            oSelection.removeStringBookmark(sBM);

            this.oApp.exec("FOCUS");
            this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["ONCLICK", {sSaveTarget:(this.bModify ? "A" : null)}]);
        }, this).bind(), 17);			
	},

    _getSelectedNode : function(){
		var aNodes = this.oSelection.getNodes();
		
		for (var i = 0; i < aNodes.length; i++) {
			if (aNodes[i].tagName && aNodes[i].tagName == "A") {
				return aNodes[i];
			}
		}
	},

    _isExceptional : function(){
		var oNavigator = jindo.$Agent().navigator();
        var bImg = false;
		
		if(!oNavigator.ie){
			return false;
		}

		// [SMARTEDITORSUS-612] 이미지 선택 후 링크 추가했을 때 링크가 걸리지 않는 문제
		if(this.oApp.getWYSIWYGDocument().selection && this.oApp.getWYSIWYGDocument().selection.type === "None"){
			bImg = jindo.$A(this.oSelection.getNodes()).some(function(value){
				if(value.nodeType === 1 && value.tagName === "IMG"){
					return true;
				}
			}, this);
			
			if(bImg){
				return true;
			}	
		}

		if(oNavigator.nativeVersion > 8){	// version? nativeVersion?
			return false;
		}	
		
		return false;
	}
});