require 'date'
require 'descriptive_statistics/refinement'
require 'rubystats'
require 'json'
require 'securerandom'

NOW = DateTime.now()


class User
    def initialize(name)
        @name = name
    end

    def to_json(*args)
        {
            'name': @name,
        }.to_json(*args)
    end
end

module Status
    To_Do = "To Do"
    In_Progress = "In Progress"
    Done = "Done"
end

module StatusId
    To_Do = 10000
    In_Progress = 3
    Done = 10001
end

module IssueType
    Story = "Story"
    Bug = "Bug"
    Task = "Task"
end


class Transition
    def initialize(fieldType, field, from_, fromString, to, toString)
        fieldType = "jira"
        field = "status"
        from_= StatusId::To_Do
        fromString = Status::To_Do
        to = StatusId::To_Do
        toString = Status::To_Do
    end

    def to_json(*args)
        {
            'fieldType': @fieldType,
            'field': @field,
            'from_': @from_,
            'fromString': @fromString,
            'to': @to,
            'toString':@toString
        }.to_json(*args)
    end
end

ToDo_to_InProgress = Transition.new(
    'jira',
    'status',
    StatusId::To_Do,
    Status::To_Do,
    StatusId::In_Progress,
    Status::In_Progress
)

InProgress_to_Done = Transition.new(
    'jira',
    'status',
    StatusId::In_Progress,
    Status::In_Progress,
    StatusId::Done,
    Status::Done
)

class HistoryItem
    def initialize(author, created, items)
        @author = author
        @created = created
        @items = items
    end

    def to_json(*args)
        {
            'author': @author,
            'created': @created,
            'items': @items
        }.to_json(*args)
    end
end

class Issue
    attr_accessor :resolution

    def initialize(description, status, reporter, issueType,
        created, updated, summary, assignee, externalId, history)
        @description = description
        @status = status
        @reporter = reporter
        @issueType = issueType
        @resolution = ''
        @created = created
        @updated = updated
        @summary = summary
        @assignee = assignee
        @externalId = externalId
        @history= history
    end

    def to_json(*args)
        {
            'description': @description,
            'status': @status,
            'reporter': @reporter,
            'issueType': @issueType,
            'resolution': @resolution,
            'created': @created,
            'updated': @updated,
            'summary': @summary,
            'assignee': @assignee,
            'externalId': @externalId,
            'history': @history
        }.to_json(*args)
    end
end

class Project
    def initialize(key, issues)
        @key = key
        @issues = issues
    end

    def to_json(*args)
        {
            'key': @key,
            'issues': @issues
        }.to_json(*args)
    end
end

class Model
    def initialize(users, projects)
        @users = users
        @projects = projects
    end

    def to_json(*args)
        {
            'users': @users,
            'projects': @projects
        }.to_json(*args)
    end
end

def generate_issue(user, creation_days_ago, duration, external_id)
    descr = summary = "This is external issue %s" % external_id
    reporter = user
    assignee = user
    status = [Status::To_Do, Status::In_Progress].sample
    
    if duration <= creation_days_ago
        status = Status::Done
    end

    created = Date.today - creation_days_ago
    updated = created + duration
    if created.wday == 5
        created = created - 1
    elsif created.wday == 6
        created = created + 1
    end

    if updated.wday == 5
        updated = updated - 1
    elsif updated.wday == 6
        updated = updated + 1
    end

    issueType = [IssueType::Story, IssueType::Bug, IssueType::Task].sample

    history = []
    if status == Status::In_Progress
        history = [
            HistoryItem.new(user, created, [ToDo_to_InProgress])
        ]
    else
        history = [
            HistoryItem.new(user, created, [ToDo_to_InProgress]),
            HistoryItem.new(user, updated, [InProgress_to_Done]),
        ]
    end

    issue = Issue.new(
        descr,
        status,
        reporter,
        issueType,
        created,
        updated,
        summary,
        assignee,
        external_id,
        history
    )
 
    if Status::Done == status
        issue.resolution = 'Done'
    end
    return issue
end

def generate_jira_issues(output, project, useridentifiers)

    mu = 3 # mean
    sigma = 10 # sd
    # Define the lower and upper bounds of the truncated distribution
    lower_bound = 0
    upper_bound = 60

    normal_distribution = Rubystats::NormalDistribution.new(mu, sigma)

    durations = Array.new(100) { |i| (normal_distribution.rng).abs }

    lookbackweeks = [1, 2, 3, 5, 8, 13, 21, 34, 55]
    issues = []

    lasttime = 0
    for weeksago in lookbackweeks
        for duration in durations
            issue = generate_issue(useridentifiers.sample, rand(weeksago*7), duration.to_i, SecureRandom.uuid())
            issues.append(issue)
            puts JSON.generate(issue)
        end
        lasttime = weeksago
    end

    users = useridentifiers.collect { |uid| User.new(uid) }

    project = Project.new(project, issues)

    puts project.inspect
    model = Model.new(users, [project])

    puts model.to_json
    File.open(output,"w") do |f|
        f.write(model.to_json)
    end
end

uids = ['6063424a6100030068144e2e']
generate_jira_issues("issues.json", "TEST2", uids)