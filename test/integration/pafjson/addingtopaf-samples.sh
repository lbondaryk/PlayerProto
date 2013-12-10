# Registering Player to CERT
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar  -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.player+json" \
	-d sanvan_player.json \
	-u http://hub.paf.cert.pearsoncmg.com/paf-hub/resources/players -c

##########
# NeffReactor

# Registering an Activity. Notice the extra \" due to bug in commons-cli: https://issues.apache.org/jira/browse/CLI-185
# Should return ID: http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.neff.1
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.sanvan.v1.activity\"\"" \
	-d sanvan_neff_item_1.activity.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities -c

# Registering an Assignment
# Should return ID: http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assignment.1
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.paf.v1.assignment+json\"\"" \
	-d sanvan_neff.assign.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities -c

# To retrieve: notice the -m GET
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m GET \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assignment.1 -c

# To Remove: notice the -m DELETE
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m DELETE \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assignment.1 -c

#  PUT: Not working. Query sent to Tom/Fred
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m PUT \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.sanvan.v1.activity\"\"" \
	-d sanvan_neff_item_1.activity.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities -c

##########
# MultipleChoice Question

# Add Activity
# @id: http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.activity.mcq1b
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.sanvan.v1.activity\"\"" \
	-d sanvan_mcq_item_1.activity.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities -c

# Add Assignment
# @id: http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assign.mcq1b
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.paf.v1.assignment+json\"\"" \
	-d sanvan_mcq.assign.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities -c

# Update Activity
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m PUT \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.paf.v1.assignment+json\"\"" \
	-d sanvan_mcq.assign.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.activity.mcq1b -c

# Update Assignment
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m PUT \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.paf.v1.assignment+json\"\"" \
	-d sanvan_mcq.assign.json \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assign.mcq1b -c

# To retrieve: notice the -m GET
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m GET \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assign.mcq1b -c


##########
# Adding content located as remote resource
paf-post-activity.sh https://raw.github.com/lbondaryk/brixContent/master/Marin/Other/E3.1.activity.json